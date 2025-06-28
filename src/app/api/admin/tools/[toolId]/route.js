import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import { logToolAction, getRequestMetadata } from '@/lib/auditLogger';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { toolId } = params;
    
    const tool = await Tool.findById(toolId);
    
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      tool,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'manager', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toolId } = params;
    const updateData = await request.json();
    
    // Get the original tool data for comparison
    const originalTool = await Tool.findById(toolId);
    if (!originalTool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Update the tool
    const updatedTool = await Tool.findByIdAndUpdate(
      toolId,
      {
        ...updateData,
        updatedBy: session.user.id,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Calculate changes for audit log
    const changes = [];
    Object.keys(updateData).forEach(key => {
      if (key !== 'updatedBy' && key !== 'updatedAt' && originalTool[key] !== updateData[key]) {
        changes.push({
          field: key,
          oldValue: originalTool[key],
          newValue: updateData[key]
        });
      }
    });

    // Log the audit trail
    try {
      const metadata = getRequestMetadata(request);
      await logToolAction({
        toolId,
        action: 'updated',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        changes,
        reason: 'Tool information updated by admin/staff',
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log tool update audit:', auditError);
      // Don't fail the update if audit logging fails
    }

    return NextResponse.json({ 
      success: true,
      tool: updatedTool,
      message: 'Tool updated successfully'
    });
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

// Add PATCH method handler (alias for PUT)
export async function PATCH(request, { params }) {
  return PUT(request, { params });
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'manager', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toolId } = params;
    
    // Get the tool data before deletion for audit log
    const toolToDelete = await Tool.findById(toolId);
    if (!toolToDelete) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Log the audit trail BEFORE deletion
    try {
      const metadata = getRequestMetadata(request);
      await logToolAction({
        toolId,
        action: 'deleted',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        changes: [{
          field: 'status',
          oldValue: 'active',
          newValue: 'deleted'
        }],
        reason: 'Tool deleted by admin/staff',
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log tool deletion audit:', auditError);
      // Don't fail the deletion if audit logging fails
    }

    // Delete the tool
    await Tool.findByIdAndDelete(toolId);

    return NextResponse.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 }
    );
  }
} 