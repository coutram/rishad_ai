import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import dotenv from 'dotenv';

dotenv.config();

class SubstackScraper {
  constructor() {
    this.baseUrl = 'https://rishad.substack.com';
    this.feedUrl = `${this.baseUrl}/feed`;
    this.archiveUrl = `${this.baseUrl}/archive?sort=new`;
    this.outputDir = './data/rishad_writings/blog_posts';
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
  }

  async ensureDirectory() {
    await fs.ensureDir(this.outputDir);
  }

  async fetchRSSFeed() {
    try {
      console.log('Fetching RSS feed from Rishad\'s Substack...');
      const response = await axios.get(this.feedUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching RSS feed:', error.message);
      throw error;
    }
  }

  async fetchArchivePage(page = 1) {
    try {
      console.log(`Fetching archive page ${page}...`);
      const url = page === 1 ? this.archiveUrl : `${this.archiveUrl}&page=${page}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching archive page ${page}:`, error.message);
      return null;
    }
  }

  async fetchAllArchivePages(maxPages = 100) {
    console.log(`\nFetching all archive pages (up to ${maxPages})...`);
    const allArticles = new Set();
    let page = 1;
    let consecutiveEmptyPages = 0;
    
    while (page <= maxPages && consecutiveEmptyPages < 3) {
      const archiveHtml = await this.fetchArchivePage(page);
      if (!archiveHtml) {
        console.log(`No content on page ${page}`);
        consecutiveEmptyPages++;
        page++;
        continue;
      }
      
      const pageArticles = this.extractArticlesFromArchive(archiveHtml);
      console.log(`Page ${page}: Found ${pageArticles.length} articles`);
      
      if (pageArticles.length === 0) {
        consecutiveEmptyPages++;
      } else {
        consecutiveEmptyPages = 0;
        for (const article of pageArticles) {
          allArticles.add(article);
        }
      }
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between pages
    }
    
    console.log(`\nTotal unique articles found across all pages: ${allArticles.size}`);
    return Array.from(allArticles);
  }

  extractArticlesFromArchive(htmlContent) {
    const articles = [];
    
    // Look for article links in the archive
    // Substack archive typically has links like /p/article-slug
    const articleRegex = /<a[^>]*href="([^"]*\/p\/[^"]*)"[^>]*>([^<]*)<\/a>/g;
    let match;
    
    while ((match = articleRegex.exec(htmlContent)) !== null) {
      const url = match[1];
      const title = match[2].trim();
      
      // Filter out navigation and non-article links
      if (title && 
          !title.includes('Subscribe') && 
          !title.includes('Sign in') &&
          !title.includes('Home') &&
          !title.includes('Archive') &&
          !title.includes('About') &&
          !title.includes('Latest') &&
          !title.includes('Top') &&
          !title.includes('Discussions') &&
          title.length > 10) {
        articles.push({ url, title });
      }
    }
    
    // Also look for article titles in different formats
    const titleRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g;
    while ((match = titleRegex.exec(htmlContent)) !== null) {
      const title = match[1].trim();
      if (title && title.length > 10 && !title.includes('Subscribe')) {
        // Try to find a corresponding URL nearby
        const beforeContent = htmlContent.substring(0, match.index);
        const urlMatch = beforeContent.match(/href="([^"]*\/p\/[^"]*)"[^>]*>$/);
        if (urlMatch) {
          articles.push({ url: urlMatch[1], title });
        }
      }
    }
    
    // Remove duplicates
    const uniqueArticles = [];
    const seenUrls = new Set();
    for (const article of articles) {
      if (!seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueArticles.push(article);
      }
    }
    
    return uniqueArticles;
  }

  cleanContent(content) {
    if (!content) return '';
    
    // Remove HTML tags but preserve line breaks
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
    
    // Weight formula: newer content gets higher weight
    // Articles from last 30 days get weight 1.0
    // Articles from last year get weight 0.8
    // Articles from 2024 get weight 0.7
    // Articles from 2023 get weight 0.6
    // Articles from 2022 get weight 0.5
    // Articles from 2021 get weight 0.4
    // Articles from 2020 get weight 0.3
    if (daysDiff <= 30) return 1.0;
    if (daysDiff <= 365) return 0.8;
    
    const year = articleDate.getFullYear();
    if (year === 2024) return 0.7;
    if (year === 2023) return 0.6;
    if (year === 2022) return 0.5;
    if (year === 2021) return 0.4;
    if (year === 2020) return 0.3;
    return 0.2; // Older than 2020
  }

  extractArticleData(item) {
    const title = item.title || 'Untitled';
    const description = item.description || '';
    const link = item.link || '';
    const pubDate = item.pubDate || '';
    const content = item['content:encoded'] || item.description || '';
    
    // Extract date for filename
    const date = new Date(pubDate);
    const dateStr = date.toISOString().split('T')[0];
    
    // Create filename from title
    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    // Calculate content weight based on recency
    const weight = this.calculateContentWeight(pubDate);
    
    return {
      title,
      description,
      link,
      pubDate,
      content: this.cleanContent(content),
      filename: `${dateStr}_${filename}.txt`,
      dateStr,
      weight,
      edition: this.extractEditionNumber(title, description)
    };
  }

  extractEditionNumber(title, description) {
    // Try to extract edition number from title or description
    const editionMatch = (title + ' ' + description).match(/Edition\s+(\d+)/i);
    return editionMatch ? parseInt(editionMatch[1]) : null;
  }

  async saveArticle(articleData) {
    const filePath = path.join(this.outputDir, articleData.filename);
    
    // Check if file already exists
    if (await fs.pathExists(filePath)) {
      console.log(`Article already exists: ${articleData.filename} (Weight: ${articleData.weight})`);
      return false;
    }

    const content = `Title: ${articleData.title}
Date: ${articleData.pubDate}
Source: ${articleData.link}
Type: Substack Blog Post
Edition: ${articleData.edition || 'Unknown'}
Content Weight: ${articleData.weight}
Recency: ${this.getRecencyDescription(articleData.weight)}

${articleData.content}

---
Source: Rishad Tobaccowala's Substack - "The Future Does Not Fit In The Containers Of The Past"
URL: ${articleData.link}
Edition: ${articleData.edition || 'Unknown'}
Content Weight: ${articleData.weight}
`;

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Saved: ${articleData.filename} (Weight: ${articleData.weight})`);
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

  async fetchArticleContent(articleUrl) {
    try {
      console.log(`Fetching article content from: ${articleUrl}`);
      const response = await axios.get(articleUrl, {
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
      
      // Fallback: look for content in other common patterns
      const fallbackMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (fallbackMatch) {
        return this.cleanContent(fallbackMatch[1]);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching article content from ${articleUrl}:`, error.message);
      return null;
    }
  }

  async scrapeArticles(maxPages = 100) {
    try {
      await this.ensureDirectory();
      
      console.log('Starting comprehensive Substack content scraping...');
      
      // First, get RSS feed (most recent content)
      const xmlData = await this.fetchRSSFeed();
      const rssItems = this.parseRSSFeed(xmlData);
      
      console.log(`Found ${rssItems.length} articles in RSS feed`);
      
      let savedCount = 0;
      let skippedCount = 0;
      let totalWeight = 0;
      
      // Process RSS items first (they're the most recent)
      for (const item of rssItems) {
        const articleData = this.extractArticleData(item);
        const saved = await this.saveArticle(articleData);
        
        if (saved) {
          savedCount++;
          totalWeight += articleData.weight;
        } else {
          skippedCount++;
        }
        
        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Now get ALL archive content
      const archiveArticles = await this.fetchAllArchivePages(maxPages);
      const rssUrls = new Set(rssItems.map(item => item.link));
      
      // Filter out RSS duplicates
      const uniqueArchiveArticles = archiveArticles.filter(article => !rssUrls.has(article.url));
      
      console.log(`\nProcessing ${uniqueArchiveArticles.length} unique archive articles...`);
      
      // Process archive articles
      for (const article of uniqueArchiveArticles) {
        // Check if we already have this article
        const existingFile = this.findExistingArticle(article.title);
        if (existingFile) {
          console.log(`Skipping ${article.title} - already exists`);
          continue;
        }
        
        // Fetch article content
        const content = await this.fetchArticleContent(article.url);
        if (content && content.length > 500) { // Only save if content is substantial
          // Try to extract date from URL or content
          const dateMatch = article.url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
          let pubDate = new Date().toISOString();
          let weight = 0.6;
          
          if (dateMatch) {
            const [_, year, month, day] = dateMatch;
            pubDate = new Date(year, month - 1, day).toISOString();
            weight = this.calculateContentWeight(pubDate);
          }
          
          const articleData = {
            title: article.title,
            content: content,
            link: article.url,
            pubDate: pubDate,
            weight: weight,
            filename: this.generateFilename(article.title, pubDate),
            dateStr: new Date(pubDate).toISOString().split('T')[0]
          };
          
          const saved = await this.saveArticle(articleData);
          if (saved) {
            savedCount++;
            totalWeight += articleData.weight;
          }
        }
        
        // Add delay between article fetches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`\nScraping completed!`);
      console.log(`- Articles saved: ${savedCount}`);
      console.log(`- Articles skipped (already exist): ${skippedCount}`);
      console.log(`- Total processed: ${rssItems.length + uniqueArchiveArticles.length}`);
      console.log(`- Average content weight: ${(totalWeight / savedCount).toFixed(2)}`);
      
      return {
        total: rssItems.length + uniqueArchiveArticles.length,
        saved: savedCount,
        skipped: skippedCount,
        averageWeight: totalWeight / savedCount
      };
      
    } catch (error) {
      console.error('Error during scraping:', error.message);
      throw error;
    }
  }

  findExistingArticle(title) {
    // Check if we already have an article with similar title
    const files = fs.readdirSync(this.outputDir);
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const normalizedFile = file.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        if (normalizedFile.includes(normalizedTitle.substring(0, 20))) {
          return file;
        }
      }
    }
    return null;
  }

  generateFilename(title, pubDate) {
    const dateStr = new Date(pubDate).toISOString().split('T')[0];
    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return `${dateStr}_${filename}.txt`;
  }

  parseRSSFeed(xmlData) {
    try {
      const result = this.parser.parse(xmlData);
      return result.rss.channel.item || [];
    } catch (error) {
      console.error('Error parsing RSS feed:', error.message);
      throw error;
    }
  }

  async getStats() {
    try {
      const files = await fs.readdir(this.outputDir);
      const stats = {
        totalFiles: files.length,
        files: [],
        weightDistribution: { 
          recent: 0, 
          older: 0, 
          '2024': 0,
          '2023': 0,
          '2022': 0,
          '2021': 0,
          '2020': 0,
          historical: 0
        },
        totalWeight: 0
      };
      
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const filePath = path.join(this.outputDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const weightMatch = content.match(/Content Weight: ([\d.]+)/);
          const weight = weightMatch ? parseFloat(weightMatch[1]) : 0.5;
          
          stats.files.push({
            name: file,
            path: filePath,
            size: fs.statSync(filePath).size,
            weight: weight
          });
          
          stats.totalWeight += weight;
          
          if (weight >= 1.0) stats.weightDistribution.recent++;
          else if (weight >= 0.8) stats.weightDistribution.older++;
          else if (weight >= 0.7) stats.weightDistribution['2024']++;
          else if (weight >= 0.6) stats.weightDistribution['2023']++;
          else if (weight >= 0.5) stats.weightDistribution['2022']++;
          else if (weight >= 0.4) stats.weightDistribution['2021']++;
          else if (weight >= 0.3) stats.weightDistribution['2020']++;
          else stats.weightDistribution.historical++;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error.message);
      return { 
        totalFiles: 0, 
        files: [], 
        weightDistribution: { 
          recent: 0, 
          older: 0, 
          '2024': 0,
          '2023': 0,
          '2022': 0,
          '2021': 0,
          '2020': 0,
          historical: 0
        }, 
        totalWeight: 0 
      };
    }
  }
}

// CLI interface
async function main() {
  const scraper = new SubstackScraper();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'scrape':
      const maxPages = process.argv[3] ? parseInt(process.argv[3]) : 100;
      await scraper.scrapeArticles(maxPages);
      break;
      
    case 'stats':
      const stats = await scraper.getStats();
      console.log('\nSubstack Content Statistics:');
      console.log(`Total articles: ${stats.totalFiles}`);
      console.log(`Average content weight: ${(stats.totalWeight / stats.totalFiles).toFixed(2)}`);
      console.log('\nWeight Distribution:');
      console.log(`- Recent (Last 30 days): ${stats.weightDistribution.recent}`);
      console.log(`- Recent (Last year): ${stats.weightDistribution.older}`);
      console.log(`- 2024: ${stats.weightDistribution['2024']}`);
      console.log(`- 2023: ${stats.weightDistribution['2023']}`);
      console.log(`- 2022: ${stats.weightDistribution['2022']}`);
      console.log(`- 2021: ${stats.weightDistribution['2021']}`);
      console.log(`- 2020: ${stats.weightDistribution['2020']}`);
      console.log(`- Historical (Pre-2020): ${stats.weightDistribution.historical}`);
      console.log('\nFiles:');
      stats.files.forEach(file => {
        console.log(`- ${file.name} (${file.size} bytes, Weight: ${file.weight})`);
      });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node src/substack-scraper.js scrape [maxPages]  - Scrape new articles from Substack');
      console.log('  node src/substack-scraper.js stats              - Show statistics of scraped content');
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SubstackScraper; 