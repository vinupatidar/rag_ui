# Nooto - AI-Powered Chat Board Landing Page

A modern, responsive landing page for an AI-powered notebook platform that allows users to upload files, analyze websites, and get intelligent answers through AI chat.

## Features

- **Modern Design**: Clean, minimalist design with gradient blue color scheme
- **Responsive Layout**: Fully responsive design that works on all devices
- **Interactive Elements**: Smooth animations and hover effects
- **AI-Focused Content**: Content specifically tailored for AI LLM-based chat board functionality
- **Call-to-Action**: Multiple CTAs that redirect to the main chat dashboard

## Tech Stack

- **React.js** - Modern React with functional components and hooks
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **PostCSS** - CSS processing with autoprefixer
- **Responsive Design** - Mobile-first approach with breakpoint utilities

## Project Structure

```
nooto-landing/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Hero.js
│   │   ├── Features.js
│   │   ├── HowItWorks.js
│   │   └── Footer.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Components

### Header
- Website name "Nooto" on the left
- "Try Nooto" button on the right that redirects to `/dashboard`

### Hero
- Compelling headline about AI-powered document analysis
- Call-to-action buttons
- Visual representation of key features

### Features
- Six key features highlighting platform capabilities
- Icons with gradient backgrounds
- Hover effects and animations

### How It Works
- Step-by-step process explanation
- Visual flow with numbered steps
- Additional CTA section

### Footer
- Company information and social links
- Quick navigation links
- Legal information

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nooto-landing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Customization

### Colors
The gradient blue theme can be customized in `tailwind.config.js`:

```javascript
colors: {
  'gradient-blue': {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... more color variations
  }
}
```

### Content
Update the content in each component file to match your specific needs:
- `src/components/Hero.js` - Main headline and description
- `src/components/Features.js` - Feature descriptions and icons
- `src/components/HowItWorks.js` - Process steps and descriptions

### Redirect URLs
Update the dashboard redirect URLs in:
- `src/components/Header.js` - "Try Nooto" button
- `src/components/Hero.js` - "Get Started Free" button
- `src/components/HowItWorks.js` - "Start Using Nooto" button

## Deployment

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`

### Vercel
1. Import your GitHub repository
2. Vercel will automatically detect React and build the project

### GitHub Pages
1. Add `"homepage": "https://username.github.io/repository-name"` to `package.json`
2. Install `gh-pages`: `npm install --save-dev gh-pages`
3. Add deploy script: `"deploy": "gh-pages -d build"`
4. Run `npm run deploy`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized images and assets
- CSS purging with Tailwind
- Lazy loading for better performance
- Responsive images and icons

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

---

**Note**: This landing page is designed to redirect users to a main chat dashboard at `/dashboard`. Make sure to implement the dashboard route in your application or update the redirect URLs to point to your actual dashboard location.
