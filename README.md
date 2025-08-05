# Rishad AI - MCP Server & Chatbot

An intelligent content analysis and style transformation system powered by Rishad Tobaccowala's insights and writing style. This project includes an MCP (Model Context Protocol) server and a web-based chatbot application.

## 🚀 Features

### Core Capabilities
- **Content Analysis**: Analyze any content from Rishad's perspective
- **Style Transformation**: Transform content to match Rishad's writing style
- **Strategic Insights**: Get forward-thinking insights on marketing, business, and technology
- **Continuous Learning**: Train the AI on new Rishad content
- **Multiple Formats**: Transform content into blog posts, tweets, presentations, emails, and more

### MCP Server Tools
1. `analyze_content_rishad_style` - Analyze content using Rishad's perspective
2. `transform_to_rishad_style` - Transform content to match Rishad's style
3. `get_rishad_insights` - Get insights on topics from Rishad's viewpoint
4. `train_on_rishad_content` - Train the model on new Rishad content

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rishad_ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4
   ```

4. **Initialize training data structure**
   ```bash
   npm run train structure
   ```

## 🎯 Usage

### Starting the Services

1. **Start the MCP Server**
   ```bash
   npm start
   ```

2. **Start the Chatbot (in a new terminal)**
   ```bash
   npm run chat
   ```

3. **Access the Web Interface**
   Open your browser and go to `http://localhost:3001`

### Training the Model

#### Interactive Training
```bash
npm run train
```

#### Command Line Training
```bash
# Train on sample data
npm run train sample

# Train from a specific file
npm run train file /path/to/file.txt "source_description"

# Train from a directory
npm run train directory /path/to/directory

# Show training statistics
npm run train stats
```

### Using the MCP Server with Claude Desktop

1. **Configure Claude Desktop**
   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "rishad-ai": {
         "command": "node",
         "args": [
           "/absolute/path/to/rishad_ai/src/server.js"
         ]
       }
     }
   }
   ```

2. **Restart Claude Desktop**
   The Rishad AI tools will now be available in Claude Desktop.

### API Endpoints

The chatbot provides REST API endpoints:

- `POST /chat` - Main chat interface
- `POST /analyze` - Analyze content
- `POST /transform` - Transform content style
- `POST /insights` - Get insights on topics
- `POST /train` - Train on new content
- `POST /transform-multiple` - Transform to multiple formats
- `POST /compare` - Compare two pieces of content
- `POST /suggest-improvements` - Suggest content improvements
- `GET /health` - Health check

## 📁 Project Structure

```
rishad_ai/
├── src/
│   ├── server.js              # MCP server implementation
│   ├── rishad-analyzer.js     # Core analysis engine
│   ├── style-transformer.js   # Style transformation logic
│   ├── content-analyzer.js    # General content analysis
│   ├── chatbot.js             # Web chatbot server
│   └── training.js            # Training utilities
├── public/
│   └── index.html             # Web interface
├── data/
│   └── rishad_writings/       # Training data directory
├── models/                    # Model cache and profiles
├── package.json
├── env.example
└── README.md
```

## 🎓 Training Data Structure

The system automatically creates organized folders for different types of Rishad's content:

- `blog_posts/` - Blog posts and articles
- `tweets/` - Twitter/X posts
- `interviews/` - Interview transcripts
- `presentations/` - Presentation content
- `books/` - Book excerpts
- `speeches/` - Speech transcripts
- `podcasts/` - Podcast transcripts

Supported file formats: `.txt`, `.md`, `.json`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4` |
| `MCP_SERVER_PORT` | MCP server port | `3000` |
| `CHATBOT_PORT` | Chatbot web server port | `3001` |
| `TRAINING_DATA_PATH` | Path to training data | `./data/rishad_writings` |
| `MODEL_CACHE_PATH` | Path to model cache | `./models` |

### Style Profile

The system maintains a dynamic style profile that captures:
- Writing tone and voice
- Key themes and topics
- Characteristic phrases
- Writing patterns
- Expertise areas

This profile is automatically updated as you train the model on new content.

## 🚀 Examples

### Content Analysis
```
Input: "Our company is launching a new digital marketing campaign targeting millennials."

Output: "The reality is that you're entering a space where traditional marketing approaches are increasingly irrelevant. Here's what's happening: millennials don't just want to be marketed to - they want authentic connections and real value. What most people miss is that this isn't about the campaign itself, but about fundamentally understanding how this audience thinks, behaves, and makes decisions..."
```

### Style Transformation
```
Input: "We need to improve our customer service."

Transformed: "The truth about customer service is that it's not just a department - it's the entire company's responsibility. We're seeing a fundamental shift where customers expect seamless, personalized experiences across every touchpoint. The future belongs to companies that can anticipate needs and deliver value before customers even ask for it..."
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Rishad Tobaccowala for his insights and thought leadership
- OpenAI for providing the underlying AI capabilities
- The MCP community for the protocol specification

## 🆘 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Ensure your OpenAI API key is valid
3. Verify all dependencies are installed
4. Check that the required ports are available

For additional help, please open an issue on the repository.

---

**Note**: This system is designed to learn from and emulate Rishad Tobaccowala's writing style and insights. It should be used responsibly and in accordance with appropriate attribution and ethical guidelines.