import { notFound } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import ViewTracker from '@/components/ViewTracker';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolDetailClient from './ToolDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTool(slug) {
  try {
    await connectDB();
    const tool = await Tool.findOne({ slug }).lean();
    if (!tool) return null;
    
    // Convert MongoDB object to plain object to avoid React warnings
    const plainTool = {
      ...tool,
      _id: tool._id.toString(),
      createdAt: tool.createdAt?.toString(),
      updatedAt: tool.updatedAt?.toString(),
      createdBy: tool.createdBy?.toString(),
      updatedBy: tool.updatedBy?.toString()
    };
    
    return plainTool;
  } catch (error) {
    console.error('Error fetching tool:', error);
    return null;
  }
}

export default async function ToolDetailPage({ params }) {
  const tool = await getTool(params.slug);
  if (!tool) notFound();

  return (
    <Layout showNeuralNetwork={false}>
      <ViewTracker toolSlug={params.slug} />
      <ToolDetailClient tool={tool} slug={params.slug} />
    </Layout>
  );
} 