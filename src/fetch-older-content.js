import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class OlderContentFetcher {
  constructor() {
    this.baseUrl = 'https://rishad.substack.com';
    this.outputDir = './data/rishad_writings/blog_posts';
  }

  async ensureDirectory() {
    await fs.ensureDir(this.outputDir);
  }

  cleanContent(content) {
    if (!content) return '';
    
    let cleaned = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#8217;/g, "'") // Replace &#8217; with '
      .replace(/&#8220;/g, '"') // Replace &#8220; with "
      .replace(/&#8221;/g, '"') // Replace &#8221; with "
      .replace(/&#8230;/g, '...') // Replace &#8230; with ...
      .replace(/\n\s*\n/g, '\n\n') // Remove extra blank lines
      .trim();

    return cleaned;
  }

  calculateContentWeight(pubDate) {
    const now = new Date();
    const articleDate = new Date(pubDate);
    const daysDiff = (now - articleDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 30) return 1.0;
    if (daysDiff <= 365) return 0.8;
    
    const year = articleDate.getFullYear();
    if (year === 2024) return 0.7;
    if (year === 2023) return 0.6;
    if (year === 2022) return 0.5;
    if (year === 2021) return 0.4;
    if (year === 2020) return 0.3;
    return 0.2;
  }

  async fetchArticle(url, title, pubDate) {
    try {
      console.log(`Fetching: ${title}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      
      // Extract article content
      const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
      if (contentMatch) {
        return this.cleanContent(contentMatch[1]);
      }
      
      // Fallback patterns
      const fallbackMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (fallbackMatch) {
        return this.cleanContent(fallbackMatch[1]);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  async saveArticle(title, content, url, pubDate) {
    const weight = this.calculateContentWeight(pubDate);
    const dateStr = new Date(pubDate).toISOString().split('T')[0];
    
    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const filePath = path.join(this.outputDir, `${dateStr}_${filename}.txt`);
    
    if (await fs.pathExists(filePath)) {
      console.log(`Article already exists: ${filename}`);
      return false;
    }

    const articleContent = `Title: ${title}
Date: ${pubDate}
Source: ${url}
Type: Substack Blog Post
Content Weight: ${weight}
Recency: ${this.getRecencyDescription(weight)}

${content}

---
Source: Rishad Tobaccowala's Substack - "The Future Does Not Fit In The Containers Of The Past"
URL: ${url}
Content Weight: ${weight}
`;

    await fs.writeFile(filePath, articleContent, 'utf8');
    console.log(`Saved: ${filename} (Weight: ${weight})`);
    return true;
  }

  getRecencyDescription(weight) {
    if (weight >= 1.0) return 'Very Recent (Last 30 days)';
    if (weight >= 0.8) return 'Recent (Last year)';
    if (weight >= 0.7) return '2024';
    if (weight >= 0.6) return '2023';
    if (weight >= 0.5) return '2022';
    if (weight >= 0.4) return '2021';
    if (weight >= 0.3) return '2020';
    return 'Historical (Pre-2020)';
  }

  async fetchOlderArticles() {
    await this.ensureDirectory();
    
    // List of known older articles from Rishad's Substack with different URL patterns
    const articles = [
      // Try some known article slugs
      {
        url: 'https://rishad.substack.com/p/strategy',
        title: 'Strategy',
        pubDate: '2023-01-15T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/future-proofing-ourselves',
        title: 'Future Proofing Ourselves',
        pubDate: '2023-02-12T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/creativity-in-an-age-of-ai',
        title: 'Creativity in an Age of AI',
        pubDate: '2023-03-12T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/trust-integrity',
        title: 'Trust & Integrity',
        pubDate: '2023-04-09T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/the-rethinking-work-show',
        title: 'The Rethinking Work Show',
        pubDate: '2023-05-07T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/ruptures-in-the-mediascape-what-next',
        title: 'Ruptures in the Mediascape: What Next?',
        pubDate: '2023-06-04T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/the-future-fits-on-one-page',
        title: 'The Future Fits on One Page',
        pubDate: '2023-07-02T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/the-decline-of-jobs-the-rise-of-work',
        title: 'The Decline of Jobs, The Rise of Work',
        pubDate: '2023-08-06T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/6-ways-to-lead-today',
        title: '6 Ways to Lead Today',
        pubDate: '2023-09-03T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/strategy-and-the-perils-of-implementation',
        title: 'Strategy and the Perils of Implementation',
        pubDate: '2023-10-01T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/chances-changes-choices',
        title: 'Chances, Changes, Choices',
        pubDate: '2023-11-05T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/exit',
        title: 'Exit',
        pubDate: '2023-12-03T00:00:00Z'
      },
      // Try some 2022 articles
      {
        url: 'https://rishad.substack.com/p/the-garden-inside',
        title: 'The Garden Inside',
        pubDate: '2022-01-09T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/4-keys-to-leading-today',
        title: '4 Keys to Leading Today',
        pubDate: '2022-02-06T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/think-like-an-immigrant',
        title: 'Think Like an Immigrant',
        pubDate: '2022-03-06T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/re-invented-marketing-5-shifts',
        title: 'Re-Invented Marketing: 5 Shifts',
        pubDate: '2022-04-03T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/forever-young',
        title: 'Forever Young',
        pubDate: '2022-05-01T00:00:00Z'
      },
      // Try some 2021 articles
      {
        url: 'https://rishad.substack.com/p/the-year-ahead-2021',
        title: 'The Year Ahead: 2021',
        pubDate: '2021-01-03T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/why-the-future-belongs-to-the-curious',
        title: 'Why the Future Belongs to the Curious',
        pubDate: '2021-02-07T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/the-rise-of-the-creative-economy',
        title: 'The Rise of the Creative Economy',
        pubDate: '2021-03-07T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/why-data-is-not-the-new-oil',
        title: 'Why Data is Not the New Oil',
        pubDate: '2021-04-04T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/the-future-of-marketing-is-not-marketing',
        title: 'The Future of Marketing is Not Marketing',
        pubDate: '2021-05-02T00:00:00Z'
      },
      // Try some 2020 articles
      {
        url: 'https://rishad.substack.com/p/the-future-does-not-fit-in-the-containers-of-the-past',
        title: 'The Future Does Not Fit In The Containers Of The Past',
        pubDate: '2020-03-15T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/restoring-the-soul-of-business',
        title: 'Restoring the Soul of Business',
        pubDate: '2020-04-12T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/three-ways-to-think-about-the-future',
        title: 'Three Ways to Think About the Future',
        pubDate: '2020-05-10T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/the-great-unbundling',
        title: 'The Great Unbundling',
        pubDate: '2020-06-07T00:00:00Z'
      },
      {
        url: 'https://rishad.substack.com/p/why-most-companies-will-fail-in-the-digital-age',
        title: 'Why Most Companies Will Fail in the Digital Age',
        pubDate: '2020-07-05T00:00:00Z'
      }
    ];

    console.log(`Fetching ${articles.length} older articles...`);
    
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const article of articles) {
      const content = await this.fetchArticle(article.url, article.title, article.pubDate);
      
      if (content && content.length > 500) {
        const saved = await this.saveArticle(article.title, content, article.url, article.pubDate);
        if (saved) {
          savedCount++;
        } else {
          skippedCount++;
        }
      } else {
        console.log(`No content found for: ${article.title}`);
        skippedCount++;
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\nCompleted!`);
    console.log(`- Articles saved: ${savedCount}`);
    console.log(`- Articles skipped: ${skippedCount}`);
    
    return { saved: savedCount, skipped: skippedCount };
  }
}

// CLI interface
async function main() {
  const fetcher = new OlderContentFetcher();
  await fetcher.fetchOlderArticles();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default OlderContentFetcher; 