# ToolNest - AI Tools Discovery Platform

A modern platform for discovering, reviewing, and managing AI tools with advanced analytics and user management features.

# Vercal Host Link : https://toolnest-ai.vercel.app

## Admin Data : Email - admin@toolnest.com, Password - 1122112211

## 🚀 Features

- **AI Tools Directory**: Comprehensive catalog of AI tools with ratings and reviews
- **User Management**: Role-based access control (Admin, Manager, Writer, User)
- **Advanced Analytics**: Real-time analytics for tools, users, and content engagement
- **Blog Platform**: Integrated blogging system with rich text editor
- **Review System**: User reviews and ratings with moderation capabilities
- **Search & Filter**: Powerful search with category and subcategory filters
- **Responsive Design**: Modern UI with dark theme and mobile optimization

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with MongoDB adapter
- **UI Components**: Heroicons, Lucide React
- **Styling**: Tailwind CSS with custom animations

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- MongoDB database (local or Atlas)

## 🚀 Production Deployment

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/toolnest
# For production, use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/toolnest

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key-here

# Additional Security (Optional)
NODE_ENV=production
```

### Installation & Build

```bash
# Clone the repository
git clone <repository-url>
cd toolnest

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Database Setup

1. **Create Admin User**:
```bash
npm run create-admin "Admin Name" "admin@example.com" "secure-password"
```

2. **Update User Roles** (if needed):
```bash
npm run update-role "user@example.com" "admin"
```

### Production Optimizations

The application includes several production optimizations:

- **Console Removal**: Debug logs are automatically removed in production
- **Image Optimization**: WebP and AVIF format support
- **Bundle Optimization**: Tree shaking and code splitting
- **Compression**: Gzip compression enabled
- **Security Headers**: Security-focused HTTP headers

### Deployment Options

#### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### PM2 (Traditional Server)
```bash
npm install -g pm2
pm2 start npm --name "toolnest" -- start
pm2 save
pm2 startup
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Clean build cache
npm run clean
```

## 📊 Features Overview

### User Roles
- **Admin**: Full system access, user management, analytics
- **Manager**: Content moderation, user management, analytics
- **Writer**: Blog creation, content management
- **User**: Tool browsing, reviews, bookmarks

### Analytics Dashboard
- Real-time user engagement metrics
- Tool popularity tracking
- Blog post performance analytics
- Staff activity monitoring

### Content Management
- Rich text blog editor with auto-save
- Tool submission and approval workflow
- Review moderation system
- Category and tag management

## 🔐 Security

- Secure authentication with NextAuth.js
- Role-based access control
- Input validation and sanitization
- CSRF protection
- Rate limiting on API endpoints

## 📈 Performance

- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Image optimization with WebP/AVIF
- Code splitting and lazy loading
- Optimized bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request


## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

Built with ❤️ using Next.js and modern web technologies.
