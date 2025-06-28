import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Tool from '@/models/Tool';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all tools and group them by category
    const tools = await Tool.find({});
    const categoryMap = new Map();
    
    tools.forEach(tool => {
      if (tool.category) {
        if (!categoryMap.has(tool.category)) {
          categoryMap.set(tool.category, {
            name: tool.category,
            slug: tool.category.toLowerCase().replace(/\s+/g, '-'),
            description: `AI tools for ${tool.category.toLowerCase()}`,
            count: 0,
            color: getRandomColor()
          });
        }
        categoryMap.get(tool.category).count++;
      }
    });

    // Convert Map to array and sort by count
    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// Helper function to get a random color from our color palette
function getRandomColor() {
  const colors = ['indigo', 'purple', 'pink', 'blue', 'green', 'yellow', 'red'];
  return colors[Math.floor(Math.random() * colors.length)];
} 
