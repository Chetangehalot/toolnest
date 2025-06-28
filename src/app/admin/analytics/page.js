'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  StarIcon,
  CogIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { formatDistanceToNow } from 'date-fns';

const AnalyticsCard = ({ title, value, change, changeType, icon: Icon, color = "text-[#00FFE0]", bgColor = "from-[#00FFE0]/20 to-[#B936F4]/20" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${bgColor} flex items-center justify-center`}>
        {Icon && <Icon className={`w-6 h-6 ${color}`} />}
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          changeType === 'positive' ? 'bg-green-500/20 text-green-400' : 
          changeType === 'negative' ? 'bg-red-500/20 text-red-400' : 
          'bg-gray-500/20 text-gray-400'
        }`}>
          {changeType === 'positive' ? (
            <ArrowUpIcon className="w-3 h-3" />
          ) : changeType === 'negative' ? (
            <ArrowDownIcon className="w-3 h-3" />
          ) : null}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div>
      <h3 className="text-[#CFCFCF] text-sm font-medium mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  </motion.div>
);

// Component for 24-hour hourly views chart (line chart style like MultiLineChart)
const HourlyChart = ({ data = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#CFCFCF]">
        <div className="text-center">
          <EyeIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No hourly data available</div>
        </div>
      </div>
    );
  }

  const maxViews = Math.max(...data.map(d => d.views || 0), 1);
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = { top: 25, right: 25, bottom: 45, left: 45 };

  const getX = (index) => padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  const getY = (value) => padding.top + ((maxViews - value) / maxViews) * (chartHeight - padding.top - padding.bottom);

  // Generate smooth path for the line
  const generatePath = (values) => {
    if (values.length === 0) return '';
    
    let path = `M ${getX(0)} ${getY(values[0])}`;
    
    for (let i = 1; i < values.length; i++) {
      const x = getX(i);
      const y = getY(values[i]);
      
      if (i === 1) {
        path += ` L ${x} ${y}`;
      } else {
        // Create smooth curves
        const prevX = getX(i - 1);
        const prevY = getY(values[i - 1]);
        const cpx1 = prevX + (x - prevX) * 0.5;
        const cpy1 = prevY;
        const cpx2 = x - (x - prevX) * 0.5;
        const cpy2 = y;
        path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${x} ${y}`;
      }
    }
    
    return path;
  };

  const viewValues = data.map(d => d.views || 0);
  const pathData = generatePath(viewValues);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartX = x - padding.left;
    const chartWidthUsable = chartWidth - padding.left - padding.right;
    const index = Math.round((chartX / chartWidthUsable) * (data.length - 1));
    
    if (index >= 0 && index < data.length) {
      setHoveredPoint({
        index,
        data: data[index],
        x: getX(index),
        y: getY(data[index].views || 0)
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="space-y-4">
      {/* Chart Container */}
      <div className="w-full flex justify-center">
        <div className="relative">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="max-w-full h-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding.left}
                y1={padding.top + ratio * (chartHeight - padding.top - padding.bottom)}
                x2={chartWidth - padding.right}
                y2={padding.top + ratio * (chartHeight - padding.top - padding.bottom)}
                stroke="#CFCFCF"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
            ))}

            {/* Vertical grid lines for time */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding.left + ratio * (chartWidth - padding.left - padding.right)}
                y1={padding.top}
                x2={padding.left + ratio * (chartWidth - padding.left - padding.right)}
                y2={chartHeight - padding.bottom}
                stroke="#CFCFCF"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
            ))}

            {/* Main line */}
            <path
              d={pathData}
              fill="none"
              stroke="#10B981"
              strokeWidth={2.5}
              className="drop-shadow-sm"
            />

            {/* Gradient fill under the line */}
            <defs>
              <linearGradient id="viewsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <path
              d={`${pathData} L ${getX(data.length - 1)} ${chartHeight - padding.bottom} L ${getX(0)} ${chartHeight - padding.bottom} Z`}
              fill="url(#viewsGradient)"
            />

            {/* Data points */}
            {data.map((hour, index) => (
              <circle
                key={index}
                cx={getX(index)}
                cy={getY(hour.views || 0)}
                r={hoveredPoint?.index === index ? 5 : 3}
                fill="#10B981"
                stroke="#0A0F24"
                strokeWidth={1.5}
                className="transition-all duration-200"
              />
            ))}

            {/* Hour labels */}
            {data.map((hour, index) => {
              if (index % 4 === 0) { // Show every 4th hour for better readability
                return (
                  <text
                    key={index}
                    x={getX(index)}
                    y={chartHeight - padding.bottom + 18}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#CFCFCF"
                  >
                    {hour.hour}
                  </text>
                );
              }
              return null;
            })}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = Math.round(maxViews * (1 - ratio));
              return (
                <text
                  key={ratio}
                  x={padding.left - 10}
                  y={padding.top + ratio * (chartHeight - padding.top - padding.bottom) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#CFCFCF"
                >
                  {value}
                </text>
              );
            })}

            {/* Tooltip */}
            {hoveredPoint && (
              <g>
                <rect
                  x={Math.max(10, Math.min(chartWidth - 80, hoveredPoint.x - 40))}
                  y={Math.max(10, hoveredPoint.y - 45)}
                  width={80}
                  height={32}
                  fill="#0A0F24"
                  stroke="#10B981"
                  strokeWidth={1}
                  rx={6}
                  className="drop-shadow-lg"
                />
                <text
                  x={Math.max(50, Math.min(chartWidth - 40, hoveredPoint.x))}
                  y={Math.max(25, hoveredPoint.y - 28)}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#F5F5F5"
                  fontWeight="bold"
                >
                  {hoveredPoint.data.hour}
                </text>
                <text
                  x={Math.max(50, Math.min(chartWidth - 40, hoveredPoint.x))}
                  y={Math.max(38, hoveredPoint.y - 15)}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#10B981"
                >
                  {hoveredPoint.data.views} views
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-[#0A0F24]/20 rounded-lg p-3 border border-[#10B981]/20">
          <div className="text-[#10B981] font-bold text-lg">
            {data.reduce((sum, h) => sum + (h.views || 0), 0)}
          </div>
          <div className="text-[#CFCFCF] text-xs">Total Views (24h)</div>
        </div>
        <div className="bg-[#0A0F24]/20 rounded-lg p-3 border border-[#F59E0B]/20">
          <div className="text-[#F59E0B] font-bold text-lg">
            {Math.max(...data.map(h => h.views || 0))}
          </div>
          <div className="text-[#CFCFCF] text-xs">Peak Hour</div>
        </div>
        <div className="bg-[#0A0F24]/20 rounded-lg p-3 border border-[#B936F4]/20">
          <div className="text-[#B936F4] font-bold text-lg">
            {Math.round(data.reduce((sum, h) => sum + (h.views || 0), 0) / 24)}
          </div>
          <div className="text-[#CFCFCF] text-xs">Avg/Hour</div>
        </div>
      </div>
    </div>
  );
};

const SimpleChart = ({ data = [], type = 'views', timeRange = '30' }) => {
  // State for cursor tracking - must be at the top
  const [cursorData, setCursorData] = useState(null);

  if (!data.length) return <div className="text-[#CFCFCF] text-center py-4">No data available</div>;
  
  // Use all available data instead of hardcoded slice
  const chartData = data;
  const values = chartData.map(d => d[type] || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // If all values are 0, show a flat line with minimal height
  const showFlatLine = maxValue === 0;
  const effectiveMax = showFlatLine ? 1 : maxValue;

  // Get the time period text
  const getTimeRangeText = (days) => {
    switch(days) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      case '365': return 'Last year';
      default: return `Last ${days} days`;
    }
  };

  // Smart date filtering based on time range - Fixed sequence logic
  const getDateLabels = () => {
    const totalDays = parseInt(timeRange);
    const labels = [];
    const today = new Date();
    
    if (totalDays <= 7) {
      // Show every day for 7 days or less, always include today
      chartData.forEach((day, index) => {
        labels.push({
          index,
          date: day.date,
          label: new Date(day.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      });
    } else if (totalDays <= 30) {
      // Show every 2nd date counting backwards from the last date (today)
      const lastIndex = chartData.length - 1;
      
      // Start from the last date and work backwards with step of 2
      for (let i = lastIndex; i >= 0; i -= 2) {
        labels.unshift({
          index: i,
          date: chartData[i].date,
          label: new Date(chartData[i].date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    } else if (totalDays <= 90) {
      // Show every 5th-6th date counting backwards from the last date
      const lastIndex = chartData.length - 1;
      const step = Math.ceil(chartData.length / 15);
      
      // Start from the last date and work backwards
      for (let i = lastIndex; i >= 0; i -= step) {
        labels.unshift({
          index: i,
          date: chartData[i].date,
          label: new Date(chartData[i].date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
      
      // Ensure we don't have too many labels
      if (labels.length > 15) {
        const filteredLabels = [];
        const labelStep = Math.ceil(labels.length / 15);
        for (let i = 0; i < labels.length; i += labelStep) {
          filteredLabels.push(labels[i]);
        }
        // Always include the last label (today)
        if (filteredLabels[filteredLabels.length - 1].index !== lastIndex) {
          filteredLabels.push(labels[labels.length - 1]);
        }
        return filteredLabels;
      }
    } else {
      // Show months for year view, counting backwards
      const lastIndex = chartData.length - 1;
      const step = Math.ceil(chartData.length / 12);
      
      for (let i = lastIndex; i >= 0; i -= step) {
        labels.unshift({
          index: i,
          date: chartData[i].date,
          label: new Date(chartData[i].date).toLocaleDateString('en-US', { 
            month: 'short'
          })
        });
      }
    }
    
    return labels;
  };

  const dateLabels = getDateLabels();

  // Handle mouse movement for cursor tracking
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Find the closest data point
    const dataIndex = Math.round((x / 100) * (chartData.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, chartData.length - 1));
    
    if (chartData[clampedIndex]) {
      setCursorData({
        x: x,
        index: clampedIndex,
        date: chartData[clampedIndex].date,
        value: chartData[clampedIndex][type] || 0,
        actualX: (clampedIndex / (chartData.length - 1)) * 100
      });
    }
  };

  const handleMouseLeave = () => {
    setCursorData(null);
  };

  return (
    <div className="space-y-4">
      {/* Chart Header with Stats */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-[#CFCFCF]">{getTimeRangeText(timeRange)}</div>
        <div className="flex items-center gap-4">
          <div className="text-[#00FFE0]">
            Peak: <span className="font-bold">{maxValue}</span>
          </div>
          <div className="text-[#10B981]">
            Avg: <span className="font-bold">{Math.round(avgValue)}</span>
          </div>
          {minValue !== maxValue && (
            <div className="text-[#F59E0B]">
              Range: <span className="font-bold">{minValue}-{maxValue}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="relative">
        {/* Main Chart Area */}
        <div className="relative h-52 bg-gradient-to-b from-[#0A0F24]/5 to-[#0A0F24]/20 rounded-lg border border-[#00FFE0]/10 overflow-visible">
          {/* Background Grid */}
          <div className="absolute inset-0">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-20">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-t border-[#CFCFCF]/30"></div>
              ))}
            </div>
            {/* Vertical grid lines */}
            <div className="absolute inset-0 flex justify-between opacity-20">
              {[...Array(Math.min(8, chartData.length))].map((_, i) => (
                <div key={i} className="border-l border-[#CFCFCF]/30 h-full"></div>
              ))}
            </div>
          </div>
          
          {/* SVG Chart */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop 
                  offset="0%" 
                  stopColor={
                    type === 'views' ? '#10B981' :
                    type === 'likes' ? '#B936F4' :
                    type === 'comments' ? '#F59E0B' :
                    '#00FFE0'
                  } 
                  stopOpacity="0.3"
                />
                <stop 
                  offset="100%" 
                  stopColor={
                    type === 'views' ? '#10B981' :
                    type === 'likes' ? '#B936F4' :
                    type === 'comments' ? '#F59E0B' :
                    '#00FFE0'
                  } 
                  stopOpacity="0.05"
                />
              </linearGradient>
            </defs>
            
            {/* Filled area under the line */}
            <path
              d={(() => {
                if (chartData.length === 0) return '';
                if (chartData.length === 1) {
                  const value = chartData[0][type] || 0;
                  const y = 100 - (showFlatLine ? 50 : (value / effectiveMax) * 85) - 10;
                  return `M 0,90 L 50,${y} L 100,90 Z`;
                }
                const points = chartData.map((day, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const value = day[type] || 0;
                  const y = 100 - (showFlatLine ? 50 : (value / effectiveMax) * 85) - 10;
                  return `${x},${y}`;
                });
                return `M 0,90 L ${points.join(' L ')} L 100,90 Z`;
              })()}
              fill={`url(#gradient-${type})`}
              className="transition-all duration-300"
            />
            
            {/* Main line - thin and sharp */}
            <path
              d={(() => {
                if (chartData.length === 0) return '';
                if (chartData.length === 1) {
                  const value = chartData[0][type] || 0;
                  const y = 100 - (showFlatLine ? 50 : (value / effectiveMax) * 85) - 10;
                  return `M 50,${y}`;
                }
                const points = chartData.map((day, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const value = day[type] || 0;
                  const y = 100 - (showFlatLine ? 50 : (value / effectiveMax) * 85) - 10;
                  return `${x},${y}`;
                });
                return `M ${points.join(' L ')}`;
              })()}
              fill="none"
              stroke={
                type === 'views' ? '#10B981' :
                type === 'likes' ? '#B936F4' :
                type === 'comments' ? '#F59E0B' :
                '#00FFE0'
              }
              strokeWidth="0.3"
              className="transition-all duration-300"
            />
            
            {/* Data point indicators - small dots on the line */}
            {chartData.map((day, index) => {
              const x = (index / (chartData.length - 1)) * 100;
              const value = day[type] || 0;
              const y = 100 - (showFlatLine ? 50 : (value / effectiveMax) * 85) - 10;
              
              return (
                <circle
                  key={`dot-${index}`}
                  cx={x}
                  cy={y}
                  r="0.4"
                  fill={
                    type === 'views' ? '#10B981' :
                    type === 'likes' ? '#B936F4' :
                    type === 'comments' ? '#F59E0B' :
                    '#00FFE0'
                  }
                  className="transition-all duration-300"
                />
              );
            })}
            
            {/* Invisible hover areas - for ALL data points including zeros */}
            {chartData.map((day, index) => {
              const x = (index / (chartData.length - 1)) * 100;
              const value = day[type] || 0;
              const y = 100 - (showFlatLine ? 50 : (value / effectiveMax) * 85) - 10;
              
              return (
                <g key={index}>
                  {/* Invisible hover area */}
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      const tooltip = e.target.parentElement.parentElement.parentElement.querySelector(`[data-tooltip="${index}"]`);
                      if (tooltip) tooltip.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const tooltip = e.target.parentElement.parentElement.parentElement.querySelector(`[data-tooltip="${index}"]`);
                      if (tooltip) tooltip.style.opacity = '0';
                    }}
                  />
                </g>
              );
            })}
            
            {/* Vertical cursor line that follows mouse */}
            {cursorData && (
              <line
                x1={cursorData.actualX}
                y1="0"
                x2={cursorData.actualX}
                y2="100"
                stroke="#00FFE0"
                strokeWidth="0.2"
                strokeDasharray="1,1"
                className="opacity-70"
              />
            )}
          </svg>
          
                     {/* Floating cursor tooltip */}
           {cursorData && (
             <div
               className="absolute pointer-events-none z-30 transition-all duration-100"
               style={{
                 left: `${cursorData.actualX}%`,
                 top: '-10px',
                 transform: cursorData.actualX > 75 ? 'translateX(-100%)' : cursorData.actualX < 25 ? 'translateX(0%)' : 'translateX(-50%)'
               }}
             >
               <div className="bg-[#0A0F24]/95 border border-[#00FFE0]/60 rounded-lg px-3 py-2 text-xs text-[#F5F5F5] shadow-xl backdrop-blur-sm whitespace-nowrap">
                 <div className="font-medium text-center text-[#00FFE0]">
                   {new Date(cursorData.date).toLocaleDateString('en-US', { 
                     month: 'short', 
                     day: 'numeric',
                     weekday: 'short'
                   })}
                 </div>
                 <div className={`font-bold text-sm text-center ${
                   type === 'views' ? 'text-[#10B981]' :
                   type === 'likes' ? 'text-[#B936F4]' :
                   type === 'comments' ? 'text-[#F59E0B]' :
                   'text-[#00FFE0]'
                 }`}>
                   {cursorData.value}
                 </div>
                 <div className="text-[#CFCFCF] text-[10px] text-center capitalize">
                   {type}
                 </div>
               </div>
             </div>
           )}
           
           {/* Original tooltips for data points */}
           {chartData.map((day, index) => {
             const x = (index / (chartData.length - 1)) * 100;
             const value = day[type] || 0;
             const isToday = new Date(day.date).toDateString() === new Date().toDateString();
             const isHighest = value === maxValue && maxValue > 0;
             
             // Smart positioning - adjust for right side dates
             const isRightSide = x > 75;
             const isLeftSide = x < 25;
             
             return (
               <div
                 key={index}
                 data-tooltip={index}
                 className="absolute opacity-0 transition-opacity duration-200 pointer-events-none z-20"
                 style={{ 
                   left: isRightSide ? 'auto' : isLeftSide ? '0' : `${x}%`,
                   right: isRightSide ? `${100 - x}%` : 'auto',
                   top: '-5px',
                   transform: isRightSide ? 'none' : isLeftSide ? 'none' : 'translateX(-50%)'
                 }}
               >
                 <div className="bg-[#0A0F24]/95 border border-[#00FFE0]/40 rounded-lg px-3 py-2 text-xs text-[#F5F5F5] shadow-xl backdrop-blur-sm whitespace-nowrap">
                   <div className="font-medium text-center">
                     {new Date(day.date).toLocaleDateString('en-US', { 
                       month: 'short', 
                       day: 'numeric' 
                     })}
                   </div>
                   <div className={`font-bold text-sm text-center ${
                     type === 'views' ? 'text-[#10B981]' :
                     type === 'likes' ? 'text-[#B936F4]' :
                     type === 'comments' ? 'text-[#F59E0B]' :
                     'text-[#00FFE0]'
                   }`}>
                     {value}
                   </div>
                   {isToday && <div className="text-yellow-400 text-xs text-center">Today</div>}
                   {isHighest && value > 0 && <div className="text-green-400 text-xs text-center">Peak</div>}
                 </div>
               </div>
             );
           })}
        </div>
        
        {/* Smart Date Labels at Bottom - Current date on right */}
        <div className="relative mt-2 px-2" style={{ height: '30px' }}>
          {dateLabels.map((labelData, displayIndex) => {
            const isToday = new Date(labelData.date).toDateString() === new Date().toDateString();
            const isLast = displayIndex === dateLabels.length - 1;
            
            // Calculate exact position based on data index
            const xPosition = (labelData.index / (chartData.length - 1)) * 100;
            
            return (
              <div
                key={displayIndex}
                className={`absolute text-xs transition-colors ${
                  isToday ? 'text-yellow-400 font-bold' : 'text-[#CFCFCF]'
                }`}
                style={{
                  left: `${xPosition}%`,
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {labelData.label}
                {isToday && <div className="text-yellow-300 text-[10px]">Today</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MultiLineChart = ({ data = [], timeRange = '30', blogAnalytics = null }) => {
  // State for cursor tracking - must be at the top
  const [cursorData, setCursorData] = useState(null);

  if (!data.length) return <div className="text-[#CFCFCF] text-center py-4">No data available</div>;
  
  const chartData = data;
  
  // Calculate values for all metrics
  const viewsValues = chartData.map(d => d.views || 0);
  const likesValues = chartData.map(d => d.likes || 0);
  const commentsValues = chartData.map(d => d.comments || 0);
  const engagementValues = chartData.map(d => {
    const views = d.views || 0;
    const likes = d.likes || 0;
    const comments = d.comments || 0;
    return views > 0 ? ((likes + comments) / views * 100) : 0;
  });
  
  // Find max values for scaling
  const maxViews = Math.max(...viewsValues);
  const maxLikes = Math.max(...likesValues);
  const maxComments = Math.max(...commentsValues);
  const maxEngagement = Math.max(...engagementValues);
  
  // Use the highest max for consistent scaling
  const globalMax = Math.max(maxViews, maxLikes, maxComments, maxEngagement);
  const effectiveMax = globalMax === 0 ? 1 : globalMax;

  // Enhanced CSV Export function with detailed blog post data
  const exportToCSV = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Prepare daily engagement data
    const dailyEngagementData = chartData.map((item, index) => ({
      Date: new Date(item.date).toLocaleDateString('en-US'),
      Views: item.views || 0,
      Likes: item.likes || 0,
      Comments: item.comments || 0,
      'Engagement Rate (%)': engagementValues[index].toFixed(2)
    }));

    // Prepare individual blog post performance data
    let blogPostData = [];
    if (blogAnalytics?.analytics) {
      // Combine all blog posts from different sources
      const allPosts = [
        ...(blogAnalytics.analytics.topPosts?.byViews || []),
        ...(blogAnalytics.analytics.topPosts?.byLikes || []),
        ...(blogAnalytics.analytics.mostDiscussedBlogs || []),
        ...(blogAnalytics.analytics.recentActivity || [])
      ];

      // Remove duplicates and format data
      const uniquePosts = allPosts.reduce((acc, post) => {
        if (!acc.find(p => p._id === post._id)) {
          acc.push({
            'Post ID': post._id,
            'Title': post.title || 'Untitled',
            'Slug': post.slug || '',
            'Status': post.status || 'Unknown',
            'Views': post.views || 0,
            'Likes': post.likes || 0,
            'Comments': post.comments || 0,
            'Engagement Rate (%)': post.views > 0 ? (((post.likes || 0) + (post.comments || 0)) / post.views * 100).toFixed(2) : '0.00',
            'Published Date': post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US') : 'Not Published',
            'Created Date': post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US') : 'Unknown',
            'Categories': post.categories ? post.categories.map(cat => cat.name).join(', ') : 'None',
            'Author': post.author?.name || 'Unknown'
          });
        }
        return acc;
      }, []);

      blogPostData = uniquePosts.sort((a, b) => b.Views - a.Views);
    }

    // Create separate CSV sheets data
    const sheets = [
      {
        name: 'Daily Engagement Data',
        data: dailyEngagementData
      },
      {
        name: 'Individual Blog Post Performance',
        data: blogPostData
      }
    ];

    // Since we can't create multiple sheets in a simple CSV, we'll combine them
    let csvContent = '';
    
    // Add daily engagement data
    csvContent += '=== DAILY ENGAGEMENT TRENDS ===\n';
    if (dailyEngagementData.length > 0) {
      const dailyHeaders = Object.keys(dailyEngagementData[0]);
      csvContent += dailyHeaders.join(',') + '\n';
      csvContent += dailyEngagementData.map(row => 
        dailyHeaders.map(header => row[header]).join(',')
      ).join('\n');
    }
    
    csvContent += '\n\n';
    
    // Add blog post performance data
    csvContent += '=== INDIVIDUAL BLOG POST PERFORMANCE ===\n';
    if (blogPostData.length > 0) {
      const postHeaders = Object.keys(blogPostData[0]);
      csvContent += postHeaders.join(',') + '\n';
      csvContent += blogPostData.map(row => 
        postHeaders.map(header => `"${row[header]}"`.replace(/"/g, '""')).join(',')
      ).join('\n');
    }

    // Add summary statistics
    csvContent += '\n\n=== SUMMARY STATISTICS ===\n';
    if (blogAnalytics?.analytics?.overview) {
      const summary = blogAnalytics.analytics.overview;
      csvContent += 'Metric,Value\n';
      csvContent += `Total Blog Posts,${summary.totalPosts || 0}\n`;
      csvContent += `Published Posts,${summary.publishedPosts || 0}\n`;
      csvContent += `Draft Posts,${summary.draftPosts || 0}\n`;
      csvContent += `Total Views,${summary.totalViews || 0}\n`;
      csvContent += `Total Likes,${summary.totalLikes || 0}\n`;
      csvContent += `Total Comments,${summary.totalComments || 0}\n`;
      csvContent += `Average Views per Post,${summary.avgViewsPerPost || 0}\n`;
      csvContent += `Average Likes per Post,${summary.avgLikesPerPost || 0}\n`;
      csvContent += `Overall Engagement Rate (%),${summary.engagementRate || 0}\n`;
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `blog-analytics-complete-${timeRange}days-${currentDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get the time period text
  const getTimeRangeText = (days) => {
    switch(days) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      case '365': return 'Last year';
      default: return `Last ${days} days`;
    }
  };

  // Smart date filtering (same logic as SimpleChart)
  const getDateLabels = () => {
    const totalDays = parseInt(timeRange);
    const labels = [];
    
    if (totalDays <= 7) {
      chartData.forEach((day, index) => {
        labels.push({
          index,
          date: day.date,
          label: new Date(day.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      });
    } else if (totalDays <= 30) {
      const lastIndex = chartData.length - 1;
      for (let i = lastIndex; i >= 0; i -= 2) {
        labels.unshift({
          index: i,
          date: chartData[i].date,
          label: new Date(chartData[i].date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    } else if (totalDays <= 90) {
      const lastIndex = chartData.length - 1;
      const step = Math.ceil(chartData.length / 15);
      for (let i = lastIndex; i >= 0; i -= step) {
        labels.unshift({
          index: i,
          date: chartData[i].date,
          label: new Date(chartData[i].date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    } else {
      const lastIndex = chartData.length - 1;
      const step = Math.ceil(chartData.length / 12);
      for (let i = lastIndex; i >= 0; i -= step) {
        labels.unshift({
          index: i,
          date: chartData[i].date,
          label: new Date(chartData[i].date).toLocaleDateString('en-US', { 
            month: 'short'
          })
        });
      }
    }
    
    return labels;
  };

  const dateLabels = getDateLabels();

  // Handle mouse movement for cursor tracking
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    
    const dataIndex = Math.round((x / 100) * (chartData.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, chartData.length - 1));
    
    if (chartData[clampedIndex]) {
      setCursorData({
        x: x,
        index: clampedIndex,
        date: chartData[clampedIndex].date,
        views: chartData[clampedIndex].views || 0,
        likes: chartData[clampedIndex].likes || 0,
        comments: chartData[clampedIndex].comments || 0,
        engagement: engagementValues[clampedIndex],
        actualX: (clampedIndex / (chartData.length - 1)) * 100
      });
    }
  };

  const handleMouseLeave = () => {
    setCursorData(null);
  };

  // Helper function to generate path for a metric
  const generatePath = (values) => {
    if (chartData.length === 0) return '';
    if (chartData.length === 1) {
      const y = 100 - (values[0] / effectiveMax) * 85 - 10;
      return `M 50,${y}`;
    }
    const points = values.map((value, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = 100 - (value / effectiveMax) * 85 - 10;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="space-y-4">
      {/* Chart Header with Legend and Export Button */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-[#CFCFCF]">{getTimeRangeText(timeRange)}</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[#10B981]">
            <div className="w-3 h-0.5 bg-[#10B981]"></div>
            <span>Views</span>
          </div>
          <div className="flex items-center gap-1 text-[#B936F4]">
            <div className="w-3 h-0.5 bg-[#B936F4]"></div>
            <span>Likes</span>
          </div>
          <div className="flex items-center gap-1 text-[#F59E0B]">
            <div className="w-3 h-0.5 bg-[#F59E0B]"></div>
            <span>Comments</span>
          </div>
          <div className="flex items-center gap-1 text-[#00FFE0]">
            <div className="w-3 h-0.5 bg-[#00FFE0]"></div>
            <span>Engagement %</span>
          </div>
          <button
            onClick={exportToCSV}
            className="ml-4 px-3 py-1.5 bg-[#00FFE0]/10 hover:bg-[#00FFE0]/20 border border-[#00FFE0]/30 hover:border-[#00FFE0]/50 text-[#00FFE0] text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
            title="Export chart data to CSV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="relative">
        <div className="relative h-52 bg-gradient-to-b from-[#0A0F24]/5 to-[#0A0F24]/20 rounded-lg border border-[#00FFE0]/10 overflow-visible">
          {/* Background Grid */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 flex flex-col justify-between opacity-20">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-t border-[#CFCFCF]/30"></div>
              ))}
            </div>
            <div className="absolute inset-0 flex justify-between opacity-20">
              {[...Array(Math.min(8, chartData.length))].map((_, i) => (
                <div key={i} className="border-l border-[#CFCFCF]/30 h-full"></div>
              ))}
            </div>
          </div>
          
          {/* SVG Chart */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Views Line */}
            <path
              d={generatePath(viewsValues)}
              fill="none"
              stroke="#10B981"
              strokeWidth="0.3"
              className="transition-all duration-300"
            />
            
            {/* Likes Line */}
            <path
              d={generatePath(likesValues)}
              fill="none"
              stroke="#B936F4"
              strokeWidth="0.3"
              className="transition-all duration-300"
            />
            
            {/* Comments Line */}
            <path
              d={generatePath(commentsValues)}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="0.3"
              className="transition-all duration-300"
            />
            
            {/* Engagement Rate Line */}
            <path
              d={generatePath(engagementValues)}
              fill="none"
              stroke="#00FFE0"
              strokeWidth="0.3"
              className="transition-all duration-300"
            />
            
            {/* Data point indicators for all lines */}
            {chartData.map((day, index) => {
              const x = (index / (chartData.length - 1)) * 100;
              return (
                <g key={index}>
                  {/* Views dot */}
                  <circle
                    cx={x}
                    cy={100 - (viewsValues[index] / effectiveMax) * 85 - 10}
                    r="0.4"
                    fill="#10B981"
                  />
                  {/* Likes dot */}
                  <circle
                    cx={x}
                    cy={100 - (likesValues[index] / effectiveMax) * 85 - 10}
                    r="0.4"
                    fill="#B936F4"
                  />
                  {/* Comments dot */}
                  <circle
                    cx={x}
                    cy={100 - (commentsValues[index] / effectiveMax) * 85 - 10}
                    r="0.4"
                    fill="#F59E0B"
                  />
                  {/* Engagement dot */}
                  <circle
                    cx={x}
                    cy={100 - (engagementValues[index] / effectiveMax) * 85 - 10}
                    r="0.4"
                    fill="#00FFE0"
                  />
                </g>
              );
            })}
            
            {/* Vertical cursor line */}
            {cursorData && (
              <line
                x1={cursorData.actualX}
                y1="0"
                x2={cursorData.actualX}
                y2="100"
                stroke="#00FFE0"
                strokeWidth="0.2"
                strokeDasharray="1,1"
                className="opacity-70"
              />
            )}
          </svg>
          
          {/* Multi-metric cursor tooltip */}
          {cursorData && (
            <div
              className="absolute pointer-events-none z-30 transition-all duration-100"
              style={{
                left: `${cursorData.actualX}%`,
                top: '-10px',
                transform: cursorData.actualX > 75 ? 'translateX(-100%)' : cursorData.actualX < 25 ? 'translateX(0%)' : 'translateX(-50%)'
              }}
            >
              <div className="bg-[#0A0F24]/95 border border-[#00FFE0]/60 rounded-lg px-3 py-2 text-xs text-[#F5F5F5] shadow-xl backdrop-blur-sm whitespace-nowrap">
                <div className="font-medium text-center text-[#00FFE0] mb-1">
                  {new Date(cursorData.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#10B981]">Views:</span>
                    <span className="font-bold text-[#10B981]">{cursorData.views}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#B936F4]">Likes:</span>
                    <span className="font-bold text-[#B936F4]">{cursorData.likes}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#F59E0B]">Comments:</span>
                    <span className="font-bold text-[#F59E0B]">{cursorData.comments}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#00FFE0]">Engagement:</span>
                    <span className="font-bold text-[#00FFE0]">{cursorData.engagement.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Date Labels */}
        <div className="relative mt-2 px-2" style={{ height: '30px' }}>
          {dateLabels.map((labelData, displayIndex) => {
            const isToday = new Date(labelData.date).toDateString() === new Date().toDateString();
            const xPosition = (labelData.index / (chartData.length - 1)) * 100;
            
            return (
              <div
                key={displayIndex}
                className={`absolute text-xs transition-colors ${
                  isToday ? 'text-yellow-400 font-bold' : 'text-[#CFCFCF]'
                }`}
                style={{
                  left: `${xPosition}%`,
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {labelData.label}
                {isToday && <div className="text-yellow-300 text-[10px]">Today</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Component to display today's blog posts
const TodaysBlogPosts = ({ posts = [] }) => {
  // Get today's date in multiple formats to handle timezone issues
  const now = new Date();
  const todayDate = new Date(); // Keep as Date object for toDateString()
  const todayISO = new Date().toISOString().split('T')[0]; // "2025-06-23"
  const todayString = todayDate.toDateString();
  
  const todaysPosts = posts.filter(post => {
    // Only show published posts
    if (post.status !== 'published' || !post.publishedAt) return false;
    
    const publishedDate = new Date(post.publishedAt);
    const publishedDateString = publishedDate.toDateString();
    const publishedDateISO = publishedDate.toISOString().split('T')[0];
    
    // Check both date string and ISO date matching
    const isPublishedToday = publishedDateString === todayString || publishedDateISO === todayISO;
    
    return isPublishedToday;
  }).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex justify-between items-center">
        <div className="text-[#F5F5F5] text-lg font-semibold">
          Today&apos;s Published Posts: <span className="text-[#00FFE0]">{todaysPosts.length}</span>
        </div>
        <Link
          href="/admin/blogs"
          onClick={() => {
            sessionStorage.setItem('admin-analytics-active-tab', 'blogs');
            sessionStorage.setItem('admin-analytics-scroll-position', window.scrollY.toString());
            sessionStorage.setItem('admin-analytics-returning', 'true');
          }}
          className="px-3 py-1 bg-[#00FFE0]/10 text-[#00FFE0] rounded-lg text-sm font-medium hover:bg-[#00FFE0]/20 transition-colors border border-[#00FFE0]/20"
        >
          View All
        </Link>
      </div>

      {/* Posts List */}
      {todaysPosts.length === 0 ? (
        <div className="p-6 bg-[#0A0F24]/20 rounded-lg border border-[#00FFE0]/10 text-center">
          <DocumentTextIcon className="w-12 h-12 text-[#CFCFCF] mx-auto mb-2" />
          <div className="text-[#CFCFCF] text-sm">No posts published today</div>
          <div className="text-[#CFCFCF] text-xs mt-1">
            {posts.length > 0 ? `${posts.filter(p => p.status === 'published').length} published posts available` : 'No recent posts available'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysPosts.map((post, index) => (
            <div key={post._id} className="p-4 bg-[#0A0F24]/20 rounded-lg border border-[#00FFE0]/10 hover:border-[#00FFE0]/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#00FFE0]/20 rounded-full flex items-center justify-center text-[#00FFE0] text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#F5F5F5] font-medium truncate mb-1" title={post.title}>
                    {post.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#CFCFCF]">
                    <span>By {post.author?.name || 'Unknown'}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                      Published
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component to display today's comments
const TodaysComments = ({ comments = [] }) => {
  const todaysComments = comments.filter(comment => {
    const commentDate = new Date(comment.createdAt).toDateString();
    const today = new Date().toDateString();
    return commentDate === today;
  }).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex justify-between items-center">
        <div className="text-[#F5F5F5] text-lg font-semibold">
          Today&apos;s Comments: <span className="text-[#F59E0B]">{todaysComments.length}</span>
        </div>
        <Link
          href="/admin/blogs"
          onClick={() => {
            sessionStorage.setItem('admin-analytics-active-tab', 'blogs');
            sessionStorage.setItem('admin-analytics-scroll-position', window.scrollY.toString());
            sessionStorage.setItem('admin-analytics-returning', 'true');
          }}
          className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg text-sm font-medium hover:bg-[#F59E0B]/20 transition-colors border border-[#F59E0B]/20"
        >
          View All
        </Link>
      </div>

      {/* Comments List */}
      {todaysComments.length === 0 ? (
        <div className="p-6 bg-[#0A0F24]/20 rounded-lg border border-[#F59E0B]/10 text-center">
          <ChatBubbleLeftIcon className="w-12 h-12 text-[#CFCFCF] mx-auto mb-2" />
          <div className="text-[#CFCFCF] text-sm">No comments posted today</div>
          <div className="text-[#CFCFCF] text-xs mt-1">Engagement will appear here</div>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysComments.map((comment, index) => (
            <div key={comment._id} className="p-4 bg-[#0A0F24]/20 rounded-lg border border-[#F59E0B]/10 hover:border-[#F59E0B]/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#F59E0B]/20 rounded-full flex items-center justify-center text-[#F59E0B] text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#F5F5F5] text-sm line-clamp-2 mb-2">
                    &ldquo;{comment.content || comment.text || 'Comment content'}&rdquo;
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#CFCFCF]">
                    <span>By {comment.author?.name || comment.userName || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{new Date(comment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="text-[#F59E0B]">on &ldquo;{comment.post?.title || 'Blog Post'}&rdquo;</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActivityTableRow = ({ activity, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActionBadge = (action, entityType) => {
    const actionConfig = {
      'role_changed': { color: 'bg-orange-500/20 text-orange-400', icon: '🔄' },
      'blocked': { color: 'bg-red-500/20 text-red-400', icon: '🚫' },
      'unblocked': { color: 'bg-green-500/20 text-green-400', icon: '✅' },
      'profile_updated': { color: 'bg-blue-500/20 text-blue-400', icon: '✏️' },
      'data_modified': { color: 'bg-purple-500/20 text-purple-400', icon: '🔧' },
      'account_deleted': { color: 'bg-red-600/20 text-red-500', icon: '🗑️' },
      'created': { color: 'bg-green-500/20 text-green-400', icon: entityType === 'blog' ? '📝' : entityType === 'tool' ? '🛠️' : entityType === 'review' ? '⭐' : '➕' },
      'updated': { color: 'bg-blue-500/20 text-blue-400', icon: '✏️' },
      'deleted': { color: 'bg-red-500/20 text-red-400', icon: '🗑️' },
      'permanently_deleted': { color: 'bg-red-600/20 text-red-500', icon: '🗑️' },
      'soft_deleted': { color: 'bg-red-500/20 text-red-400', icon: '🗑️' },
      'moved_to_trash': { color: 'bg-red-500/20 text-red-400', icon: '🗑️' },
      'hidden': { color: 'bg-orange-500/20 text-orange-400', icon: '👁️' },
      'restored': { color: 'bg-green-500/20 text-green-400', icon: '🔄' },
      'replied': { color: 'bg-blue-500/20 text-blue-400', icon: '💬' },
      'approved': { color: 'bg-green-500/20 text-green-400', icon: '✅' },
      'rejected': { color: 'bg-red-500/20 text-red-400', icon: '❌' },
      'reposted': { color: 'bg-blue-500/20 text-blue-400', icon: '🔄' },
      'published': { color: 'bg-green-500/20 text-green-400', icon: '🚀' },
      'unpublished': { color: 'bg-yellow-500/20 text-yellow-400', icon: '📋' },
      'verified': { color: 'bg-blue-500/20 text-blue-400', icon: '✓' },
      'unverified': { color: 'bg-gray-500/20 text-gray-400', icon: '○' }
    };

    const config = actionConfig[action] || { color: 'bg-gray-500/20 text-gray-400', icon: '❓' };
    
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {action.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const getEntityTypeBadge = (entityType) => {
    const typeConfig = {
      'user': 'bg-blue-500/20 text-blue-400',
      'tool': 'bg-purple-500/20 text-purple-400', 
      'review': 'bg-orange-500/20 text-orange-400',
      'blog': 'bg-indigo-500/20 text-indigo-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[entityType] || 'bg-gray-500/20 text-gray-400'}`}>
        {entityType || 'unknown'}
      </span>
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'manager': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'writer': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Enhanced helper functions for better data display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toLocaleString();
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <>
      <tr className="hover:bg-[#0A0F24]/20 transition-colors">
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="text-sm text-[#F5F5F5]">
            {formatDate(activity.timestamp)}
          </div>
          <div className="text-xs text-[#CFCFCF]">
            {formatTime(activity.timestamp)}
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {activity.staffImage ? (
              <img
                src={activity.staffImage}
                alt={activity.staffName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-[#00FFE0]/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-[#00FFE0]" />
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-[#F5F5F5]">{activity.staffName}</div>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(activity.staffRole)}`}>
                {activity.staffRole?.toUpperCase()}
              </span>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {getActionBadge(activity.action, activity.entityType)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="space-y-1">
          {getEntityTypeBadge(activity.entityType)}
            <div className="text-sm text-[#F5F5F5] max-w-xs truncate">
              {activity.entityName || 'N/A'}
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="text-sm text-[#F5F5F5] max-w-xs">
            {activity.description || 'No description available'}
          </div>
          {Array.isArray(activity.changes) && activity.changes.length > 0 && (
            <div className="text-xs text-[#CFCFCF] mt-1">
              {activity.changes.length} field(s) changed
            </div>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#00FFE0] hover:bg-[#00FFE0]/10 rounded-lg transition-colors mx-auto"
          >
            <InformationCircleIcon className="w-4 h-4" />
            {isExpanded ? 'Hide' : 'Show'}
            {isExpanded ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="6" className="px-4 py-4 bg-[#0A0F24]/20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Card */}
              <div className="bg-[#0A0F24]/40 rounded-lg p-4 border border-[#00FFE0]/10">
                <h4 className="text-sm font-medium text-[#00FFE0] mb-3 flex items-center gap-2">
                  <DocumentIcon className="w-4 h-4" />
                  Activity Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#CFCFCF]">Date:</span>
                    <span className="text-[#F5F5F5]">{formatDate(activity.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#CFCFCF]">Time:</span>
                    <span className="text-[#F5F5F5]">{formatTime(activity.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#CFCFCF]">Staff:</span>
                    <span className="text-[#F5F5F5]">{activity.staffName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#CFCFCF]">Action:</span>
                    <span className="text-[#F5F5F5]">{activity.action.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#CFCFCF]">Target:</span>
                    <span className="text-[#F5F5F5]">{activity.entityName}</span>
                  </div>
                  {activity.reason && (
                    <div className="flex justify-between">
                      <span className="text-[#CFCFCF]">Reason:</span>
                      <span className="text-[#F5F5F5] max-w-xs text-right">{activity.reason}</span>
                </div>
              )}
                </div>
              </div>

              {/* Changes Card - Only show if there are changes */}
              {Array.isArray(activity.changes) && activity.changes.length > 0 && (
                <div className="bg-[#0A0F24]/40 rounded-lg p-4 border border-[#00FFE0]/10">
                  <h4 className="text-sm font-medium text-[#00FFE0] mb-3 flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" />
                    Field Changes ({activity.changes.length})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {activity.changes.slice(0, 5).map((change, index) => (
                      <div key={index} className="bg-[#0A0F24]/60 rounded p-3 border border-[#00FFE0]/5">
                        <div className="text-xs font-medium text-[#00FFE0] mb-2 capitalize">
                          {change.field}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                            <div className="text-[#CFCFCF] mb-1">Before:</div>
                            <div className="bg-red-500/10 text-red-300 p-2 rounded border border-red-500/20 break-all">
                              {formatValue(change.oldValue)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#CFCFCF] mb-1">After:</div>
                            <div className="bg-green-500/10 text-green-300 p-2 rounded border border-green-500/20 break-all">
                              {formatValue(change.newValue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activity.changes.length > 5 && (
                      <div className="text-center text-xs text-[#CFCFCF] py-2">
                        ... and {activity.changes.length - 5} more changes
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Entity Info Card - Only show if entity info exists */}
              {activity.entityInfo && Object.keys(activity.entityInfo).length > 0 && (
                <div className="bg-[#0A0F24]/40 rounded-lg p-4 border border-[#00FFE0]/10">
                  <h4 className="text-sm font-medium text-[#00FFE0] mb-3 flex items-center gap-2">
                    <TagIcon className="w-4 h-4" />
                    Entity Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(activity.entityInfo).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[#CFCFCF] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-[#F5F5F5] max-w-xs text-right truncate">{formatValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Card - Only show if metadata exists */}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="bg-[#0A0F24]/40 rounded-lg p-4 border border-[#00FFE0]/10">
                  <h4 className="text-sm font-medium text-[#00FFE0] mb-3 flex items-center gap-2">
                    <CogIcon className="w-4 h-4" />
                    Technical Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(activity.metadata).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[#CFCFCF] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-[#F5F5F5] max-w-xs text-right truncate">{formatValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const WriterRow = ({ writer, rank }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.1 }}
    className="flex items-center justify-between p-5 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl hover:border-[#00FFE0]/20 transition-all duration-200 hover:shadow-lg hover:shadow-[#00FFE0]/5"
  >
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className="w-10 h-10 bg-gradient-to-r from-[#F59E0B]/20 to-[#F59E0B]/30 rounded-full flex items-center justify-center text-[#F59E0B] font-bold text-lg border border-[#F59E0B]/20 flex-shrink-0">
        {rank}
      </div>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {writer.image && (
          <img
            src={writer.image}
            alt={writer.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#00FFE0]/20 flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-[#F5F5F5] font-semibold text-lg truncate">{writer.name}</h4>
          <p className="text-[#CFCFCF] text-sm truncate">{writer.email}</p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4 flex-shrink-0">
      <div className="text-center px-3 py-2 bg-[#00FFE0]/10 rounded-lg border border-[#00FFE0]/20">
        <div className="text-[#00FFE0] font-bold text-lg">{writer.totalPosts}</div>
        <div className="text-[#CFCFCF] text-xs font-medium">Posts</div>
      </div>
      <div className="text-center px-3 py-2 bg-[#10B981]/10 rounded-lg border border-[#10B981]/20">
        <div className="text-[#10B981] font-bold text-lg">{writer.totalViews}</div>
        <div className="text-[#CFCFCF] text-xs font-medium">Views</div>
      </div>
      <div className="text-center px-3 py-2 bg-[#B936F4]/10 rounded-lg border border-[#B936F4]/20">
        <div className="text-[#B936F4] font-bold text-lg">{writer.totalLikes}</div>
        <div className="text-[#CFCFCF] text-xs font-medium">Likes</div>
      </div>
    </div>
  </motion.div>
);

export default function AdminAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [toolsAnalytics, setToolsAnalytics] = useState(null);
  const [blogAnalytics, setBlogAnalytics] = useState(null);
  const [staffAnalytics, setStaffAnalytics] = useState(null);
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30);
  const [dataLoaded, setDataLoaded] = useState({
    tools: false,
    blogs: false,
    staff: false,
    writers: false
  });
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin-analytics-active-tab') || 'tools';
    }
    return 'tools';
  });
  const [roleFilter, setRoleFilter] = useState('all');
  const [staffSortBy, setStaffSortBy] = useState('totalActions');

  // Recent Staff Activity filters
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityTimeRange, setActivityTimeRange] = useState(7);
  const [activityRoleFilter, setActivityRoleFilter] = useState('all');

  // Save scroll position and state before navigation
  useEffect(() => {
    const saveState = () => {
      sessionStorage.setItem('admin-analytics-active-tab', activeTab);
      sessionStorage.setItem('admin-analytics-scroll-position', window.scrollY.toString());
    };

    // Save state when tab changes
    sessionStorage.setItem('admin-analytics-active-tab', activeTab);

    // Save state before page unload
    window.addEventListener('beforeunload', saveState);
    
    return () => {
      window.removeEventListener('beforeunload', saveState);
    };
  }, [activeTab]);

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const savedScrollPosition = sessionStorage.getItem('admin-analytics-scroll-position');
      const isReturning = sessionStorage.getItem('admin-analytics-returning') === 'true';
      
      // Only restore scroll if explicitly returning from a sub-page
      if (savedScrollPosition && isReturning) {
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedScrollPosition),
            behavior: 'smooth'
          });
        }, 100);
      }
      
      // Clear the returning flag after checking
      sessionStorage.removeItem('admin-analytics-returning');
    }
  }, [loading]);

  // Filter and sort staff leaderboard
  const getFilteredStaff = React.useCallback(() => {
    if (!staffAnalytics?.analytics?.staffLeaderboard) return [];
    
    let filtered = [...staffAnalytics.analytics.staffLeaderboard];
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(staff => staff.role === roleFilter);
    }
    
    return filtered;
  }, [staffAnalytics?.analytics?.staffLeaderboard, roleFilter]);

  // Create alias for backwards compatibility
  const filteredStaffData = getFilteredStaff();

  // Clear state on fresh visits (when coming from admin panel)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      const isFromAdmin = referrer && (referrer.includes('/admin') && !referrer.includes('/admin/analytics'));
      
      if (isFromAdmin) {
        // Clear any previous state for fresh visits
        sessionStorage.removeItem('admin-analytics-scroll-position');
        sessionStorage.removeItem('admin-analytics-returning');
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (!['manager', 'admin'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    // Load all analytics data
    fetchAllAnalytics();
  }, [session, status, router]);

  // Separate useEffect for timeRange changes
  useEffect(() => {
    if (session && ['manager', 'admin'].includes(session.user.role)) {
      fetchAllAnalytics();
    }
  }, [timeRange]);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      setDataLoaded({ tools: false, blogs: false, staff: false, writers: false });

      // Fetch all analytics in parallel
      const [toolsResponse, blogResponse, staffResponse, writersResponse] = await Promise.all([
        fetch(`/api/admin/tools-analytics?timeRange=${timeRange}`).catch(() => ({ ok: false })),
        fetch(`/api/admin/analytics?timeRange=${timeRange}`).catch(() => ({ ok: false })),
        fetch(`/api/admin/staff-analytics?timeRange=${timeRange}&roleFilter=${roleFilter}`).catch(() => ({ ok: false })),
        fetch(`/api/admin/writers-analytics?timeRange=${timeRange}`).catch(() => ({ ok: false }))
      ]);

      // Process tools analytics
      try {
        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json();
          if (toolsData.success) {
            setToolsAnalytics(toolsData);
            setDataLoaded(prev => ({ ...prev, tools: true }));
          } else {
            setToolsAnalytics({ analytics: { overview: {}, dailyStats: [] } });
            setDataLoaded(prev => ({ ...prev, tools: true }));
          }
        } else {
          setToolsAnalytics({ analytics: { overview: {}, dailyStats: [] } });
          setDataLoaded(prev => ({ ...prev, tools: true }));
        }
              } catch (error) {
        setToolsAnalytics({ analytics: { overview: {}, dailyStats: [] } });
        setDataLoaded(prev => ({ ...prev, tools: true }));
      }

      // Process blog analytics
      try {
        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          if (blogData.success) {
            setBlogAnalytics(blogData);
            setDataLoaded(prev => ({ ...prev, blogs: true }));
          } else {
            setBlogAnalytics({ analytics: { overview: {}, dailyStats: [], recentActivity: [], hourlyViews: [], recentComments: [], topPosts: { byViews: [] } } });
            setDataLoaded(prev => ({ ...prev, blogs: true }));
          }
        } else {
          setBlogAnalytics({ analytics: { overview: {}, dailyStats: [], recentActivity: [], hourlyViews: [], recentComments: [], topPosts: { byViews: [] } } });
          setDataLoaded(prev => ({ ...prev, blogs: true }));
        }
      } catch (error) {
        setBlogAnalytics({ analytics: { overview: {}, dailyStats: [], recentActivity: [], hourlyViews: [], recentComments: [], topPosts: { byViews: [] } } });
        setDataLoaded(prev => ({ ...prev, blogs: true }));
      }

      // Process staff analytics
      try {
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          if (staffData.success) {
            setStaffAnalytics(staffData);
            setDataLoaded(prev => ({ ...prev, staff: true }));
            
            // Load recent activity data separately
            loadStaffActivity();
          } else {
            setStaffAnalytics({ analytics: { overview: {}, staffLeaderboard: [], roleStats: {}, loginFrequency: {} }, recentActivity: [] });
            setDataLoaded(prev => ({ ...prev, staff: true }));
          }
        } else {
          setStaffAnalytics({ analytics: { overview: {}, staffLeaderboard: [], roleStats: {}, loginFrequency: {} }, recentActivity: [] });
          setDataLoaded(prev => ({ ...prev, staff: true }));
        }
      } catch (error) {
        setStaffAnalytics({ analytics: { overview: {}, staffLeaderboard: [], roleStats: {}, loginFrequency: {} }, recentActivity: [] });
        setDataLoaded(prev => ({ ...prev, staff: true }));
      }

      // Process writers data
      try {
        if (writersResponse.ok) {
          const writersData = await writersResponse.json();
          if (writersData.success && writersData.writers) {
            setWriters(writersData.writers);
            setDataLoaded(prev => ({ ...prev, writers: true }));
          } else {
            setWriters([]);
            setDataLoaded(prev => ({ ...prev, writers: true }));
          }
        } else {
          setWriters([]);
          setDataLoaded(prev => ({ ...prev, writers: true }));
        }
      } catch (error) {
        setWriters([]);
        setDataLoaded(prev => ({ ...prev, writers: true }));
      }

    } catch (error) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffActivity = async () => {
    try {
      const activityResponse = await fetch(`/api/admin/staff-analytics/activity-logs?days=${activityTimeRange}`);
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success) {
          setStaffAnalytics(prev => ({
            ...prev,
            recentActivity: activityData.data.activities || []
          }));
        }
      }
    } catch (error) {
      // Silent error handling for staff activity loading
    }
  };

  // Enhanced CSV Export functionality for Staff Activity - RESPECTS FILTERS
  const exportActivityToCSV = () => {
    // Determine what data to export based on filters
    const hasActiveFilters = 
      activitySearchTerm !== '' || 
      activityTypeFilter !== 'all' || 
      activityRoleFilter !== 'all' || 
      activityTimeRange !== 7;
    
    // Use filtered data if filters are active, otherwise use all data
    const dataToExport = hasActiveFilters ? filteredActivities : (staffAnalytics?.recentActivity || []);
    
    if (!dataToExport || dataToExport.length === 0) {
      return; // Silently return if no data to export
    }

    // Comprehensive headers for all available data
    const headers = [
      'Date',
      'Time',
      'Staff Name',
      'Staff Email', 
      'Staff Role',
      'Action Type',
      'Entity Type',
      'Entity Name',
      'Entity ID',
      'Description',
      'Reason',
      'Changes Count',
      'Field Changes',
      'Entity Category',
      'Entity Status', 
      'Entity Email',
      'Entity Role',
      'Rating',
      'Tool Name',
      'Author Name',
      'Activity ID',
      'Source',
      'ISO Timestamp'
    ];

    // Helper function to safely extract nested values
    const safeGet = (obj, path, defaultValue = '') => {
      try {
        return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
      } catch {
        return defaultValue;
      }
    };

    // Helper function to format changes for CSV
    const formatChanges = (changes) => {
      if (!Array.isArray(changes) || changes.length === 0) return '';
      return changes.map(change => 
        `${change.field}: "${change.oldValue}" → "${change.newValue}"`
      ).join(' | ');
    };

    // Map activity data to CSV rows
    const csvData = dataToExport.map(activity => {
      const timestamp = new Date(activity.timestamp);
      const entityInfo = activity.entityInfo || {};
      
      return [
        timestamp.toLocaleDateString('en-US'),
        timestamp.toLocaleTimeString('en-US'),
        activity.staffName || '',
        activity.staffEmail || '',
        activity.staffRole || '',
        activity.action || '',
        activity.entityType || '',
        activity.entityName || '',
        activity.entityId || '',
        activity.description || '',
        activity.reason || '',
        Array.isArray(activity.changes) ? activity.changes.length : 0,
        formatChanges(activity.changes),
        safeGet(entityInfo, 'category'),
        safeGet(entityInfo, 'status'),
        safeGet(entityInfo, 'email'),
        safeGet(entityInfo, 'role'),
        safeGet(entityInfo, 'rating'),
        safeGet(entityInfo, 'tool'),
        safeGet(entityInfo, 'author'),
        activity.id || '',
        activity.source || '',
        activity.timestamp || ''
      ];
    });

    // Create CSV content with proper escaping
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => {
        // Properly escape fields containing commas, quotes, or newlines
        const stringField = String(field).replace(/"/g, '""');
        return stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') 
          ? `"${stringField}"` 
          : stringField;
      }).join(','))
      .join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    // Dynamic filename based on export type
    const filename = hasActiveFilters 
      ? `staff-activity-filtered-${dateStr}-${timeStr}.csv`
      : `staff-activity-complete-${dateStr}-${timeStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);

    // No alert messages - file will download silently
  };

  // Filter activities based on all filter criteria - IMPROVED FILTERING LOGIC
  const filteredActivities = React.useMemo(() => {
    if (!staffAnalytics?.recentActivity) return [];

    let filtered = [...staffAnalytics.recentActivity];

    // Apply search filter - enhanced to search more fields
    if (activitySearchTerm) {
      const searchLower = activitySearchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.staffName?.toLowerCase().includes(searchLower) ||
        activity.staffEmail?.toLowerCase().includes(searchLower) ||
        activity.description?.toLowerCase().includes(searchLower) ||
        activity.action?.toLowerCase().includes(searchLower) ||
        activity.entityType?.toLowerCase().includes(searchLower) ||
        activity.entityName?.toLowerCase().includes(searchLower) ||
        activity.reason?.toLowerCase().includes(searchLower) ||
        (activity.entityInfo?.category && activity.entityInfo.category.toLowerCase().includes(searchLower))
      );
    }

    // Apply activity type filter - FIXED FILTERING LOGIC
    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(activity => {
        const entityType = activity.entityType?.toLowerCase();
        const action = activity.action?.toLowerCase();
        
        switch (activityTypeFilter) {
          case 'user_management':
            return entityType === 'user' || entityType === 'User' || 
                   action.includes('user') || action.includes('account') || 
                   action.includes('role') || action.includes('blocked');
          case 'blog_management':
            return entityType === 'blog' || entityType === 'Blog' || 
                   action.includes('blog') || action.includes('post');
          case 'tool_management':
            return entityType === 'tool' || entityType === 'Tool' || 
                   action.includes('tool') || action.includes('verified');
          case 'review_management':
            return entityType === 'review' || entityType === 'Review' || 
                   action.includes('review') || action.includes('rating');
          case 'system':
            return entityType === 'system' || action.includes('system') || 
                   action.includes('config') || action.includes('admin');
          default:
            return true;
        }
      });
    }

    // Apply role filter
    if (activityRoleFilter !== 'all') {
      filtered = filtered.filter(activity => activity.staffRole === activityRoleFilter);
    }

    // Time range filter is handled by the API, but we can still apply client-side filtering
    const timeRangeStart = new Date();
    timeRangeStart.setDate(timeRangeStart.getDate() - activityTimeRange);
    filtered = filtered.filter(activity => 
      new Date(activity.timestamp) >= timeRangeStart
    );

    // Sort by timestamp (most recent first) to ensure proper ordering
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  }, [staffAnalytics?.recentActivity, activitySearchTerm, activityTypeFilter, activityRoleFilter, activityTimeRange]);

  // Get unique roles for filter dropdown
  const availableRoles = React.useMemo(() => {
    if (!staffAnalytics?.recentActivity) return [];
    const roles = [...new Set(staffAnalytics.recentActivity.map(activity => activity.staffRole))];
    return roles.filter(Boolean).sort();
  }, [staffAnalytics?.recentActivity]);

  // Load staff activity when activity time range changes
  useEffect(() => {
    if (staffAnalytics && session && ['manager', 'admin'].includes(session.user.role)) {
      loadStaffActivity();
    }
  }, [activityTimeRange]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0D1235] to-[#1A1B3A] text-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00FFE0] mx-auto mb-4"></div>
          <p className="text-[#CFCFCF]">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0D1235] to-[#1A1B3A] text-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Analytics</h2>
          <p className="text-[#CFCFCF] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-lg font-semibold hover:bg-[#00D4AA] transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] to-[#CFCFCF] mb-2">
                  Platform Analytics Dashboard
                </h1>
                <p className="text-[#CFCFCF] text-lg">
                  Comprehensive analytics across tools, content, and staff performance
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(parseInt(e.target.value))}
                  className="px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl focus:border-[#00FFE0]/40 focus:outline-none"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                  title="Return to previous page"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Admin Panel
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setActiveTab('tools')}
                data-active-tab={activeTab === 'tools' ? 'tools' : undefined}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'tools' 
                    ? 'bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5] hover:bg-[#0A0F24]/30'
                }`}
              >
                <WrenchScrewdriverIcon className="w-5 h-5" />
                Tools Analysis
              </button>
              <button
                onClick={() => setActiveTab('blogs')}
                data-active-tab={activeTab === 'blogs' ? 'blogs' : undefined}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'blogs' 
                    ? 'bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5] hover:bg-[#0A0F24]/30'
                }`}
              >
                <PencilSquareIcon className="w-5 h-5" />
                Blog Analysis
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                data-active-tab={activeTab === 'staff' ? 'staff' : undefined}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'staff' 
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5] hover:bg-[#0A0F24]/30'
                }`}
              >
                <UsersIcon className="w-5 h-5" />
                Staff Analysis
              </button>
            </div>

            {/* Tools Analysis Tab */}
            {activeTab === 'tools' && (
              <>
                {!dataLoaded.tools && (
                  <div className="flex items-center justify-center h-64 mb-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFE0] mx-auto mb-4"></div>
                      <p className="text-[#CFCFCF]">Loading tools analytics...</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <AnalyticsCard
                    title="Total Tools"
                    value={toolsAnalytics?.analytics?.overview?.totalTools?.toLocaleString() || '0'}
                    icon={WrenchScrewdriverIcon}
                    color="text-[#00FFE0]"
                    bgColor="from-[#00FFE0]/20 to-[#00D4AA]/20"
                  />
                  <AnalyticsCard
                    title="Total Reviews"
                    value={toolsAnalytics?.analytics?.overview?.totalReviews?.toLocaleString() || '0'}
                    icon={ChatBubbleLeftIcon}
                    color="text-[#B936F4]"
                    bgColor="from-[#B936F4]/20 to-[#8B5CF6]/20"
                  />
                  <AnalyticsCard
                    title="Total Views"
                    value={toolsAnalytics?.analytics?.overview?.totalViews?.toLocaleString() || '0'}
                    icon={EyeIcon}
                    color="text-[#10B981]"
                    bgColor="from-[#10B981]/20 to-[#059669]/20"
                  />
                  <AnalyticsCard
                    title="Avg Rating"
                    value={`${toolsAnalytics?.analytics?.overview?.avgRating || '0'}/5`}
                    icon={StarIcon}
                    color="text-[#F59E0B]"
                    bgColor="from-[#F59E0B]/20 to-[#D97706]/20"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <StarIcon className="w-5 h-5 text-[#F59E0B]" />
                      Top Rated Tools
                    </h3>
                    <div className="space-y-4">
                      {toolsAnalytics?.analytics?.topTools?.byRating?.slice(0, 5).map((tool, index) => (
                        <div key={tool._id} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-6 h-6 bg-[#F59E0B]/20 rounded-full flex items-center justify-center text-[#F59E0B] font-bold text-xs">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <Link 
                                href={`/tools/${tool.slug}`}
                                className="text-[#F5F5F5] font-medium hover:text-[#00FFE0] transition-colors line-clamp-1"
                              >
                                {tool.name}
                              </Link>
                              <p className="text-[#CFCFCF] text-sm">{tool.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#F59E0B] font-semibold">{tool.rating}/5</div>
                            <div className="text-[#CFCFCF] text-xs">{tool.reviewCount} reviews</div>
                          </div>
                        </div>
                      )) || <div className="text-center text-[#CFCFCF] py-4">No data available</div>}
                    </div>
                  </div>

                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 text-[#00FFE0]" />
                      Most Viewed Tools
                    </h3>
                    <div className="space-y-4">
                      {toolsAnalytics?.analytics?.topTools?.byViews?.slice(0, 5).map((tool, index) => (
                        <div key={tool._id} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-6 h-6 bg-[#00FFE0]/20 rounded-full flex items-center justify-center text-[#00FFE0] font-bold text-xs">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <Link 
                                href={`/tools/${tool.slug}`}
                                className="text-[#F5F5F5] font-medium hover:text-[#00FFE0] transition-colors line-clamp-1"
                              >
                                {tool.name}
                              </Link>
                              <p className="text-[#CFCFCF] text-sm">{tool.category}</p>
                            </div>
                          </div>
                          <div className="text-[#00FFE0] font-semibold">{tool.viewCount} views</div>
                        </div>
                      )) || <div className="text-center text-[#CFCFCF] py-4">No data available</div>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <TagIcon className="w-5 h-5 text-[#B936F4]" />
                      Category Performance
                    </h3>
                    <div className="space-y-4">
                      {toolsAnalytics?.analytics?.categoryPerformance?.slice(0, 5).map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#B936F4]/20 rounded-full flex items-center justify-center text-[#B936F4] font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-[#F5F5F5] font-medium">{category.name}</h4>
                              <p className="text-[#CFCFCF] text-sm">{category.totalPosts} posts</p>
                            </div>
                          </div>
                          <div className="text-[#B936F4] font-semibold">
                            {category.totalViews || 0} views
                          </div>
                        </div>
                      )) || <div className="text-center text-[#CFCFCF] py-4">No data available</div>}
                    </div>
                  </div>

                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-[#10B981]" />
                      Activity Trend ({timeRange === '7' ? '7 days' : timeRange === '30' ? '30 days' : timeRange === '90' ? '90 days' : timeRange === '365' ? '1 year' : `${timeRange} days`})
                    </h3>
                    <SimpleChart data={toolsAnalytics?.analytics?.dailyStats || []} type="reviews" timeRange={timeRange} />
                  </div>
                </div>
              </>
            )}

            {/* Blog Analysis Tab */}
            {activeTab === 'blogs' && (
              <>
                {!dataLoaded.blogs && (
                  <div className="flex items-center justify-center h-64 mb-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B936F4] mx-auto mb-4"></div>
                      <p className="text-[#CFCFCF]">Loading blog analytics...</p>
                    </div>
                  </div>
                )}
                
                {/* Blog Engagement Analysis - Moved to Top */}
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 mb-8">
                  <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-[#B936F4]" />
                    Blog Engagement Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Engagement Metrics */}
                    <div className="text-center p-4 bg-[#10B981]/10 rounded-xl border border-[#10B981]/20">
                      <div className="text-[#10B981] text-3xl font-bold mb-2">
                        {blogAnalytics?.analytics?.overview?.totalViews || 0}
                      </div>
                      <div className="text-[#CFCFCF] text-sm font-medium">Total Views</div>
                      <div className="text-[#10B981] text-xs mt-1">
                        {blogAnalytics?.analytics?.overview?.totalPosts > 0 
                          ? Math.round((blogAnalytics?.analytics?.overview?.totalViews || 0) / blogAnalytics?.analytics?.overview?.totalPosts)
                          : 0} avg/post
                      </div>
                    </div>

                    <div className="text-center p-4 bg-[#B936F4]/10 rounded-xl border border-[#B936F4]/20">
                      <div className="text-[#B936F4] text-3xl font-bold mb-2">
                        {blogAnalytics?.analytics?.overview?.totalLikes || 0}
                      </div>
                      <div className="text-[#CFCFCF] text-sm font-medium">Total Likes</div>
                      <div className="text-[#B936F4] text-xs mt-1">
                        {blogAnalytics?.analytics?.overview?.totalViews > 0 
                          ? ((blogAnalytics?.analytics?.overview?.totalLikes || 0) / (blogAnalytics?.analytics?.overview?.totalViews || 1) * 100).toFixed(1)
                          : 0}% like rate
                      </div>
                    </div>

                    <div className="text-center p-4 bg-[#F59E0B]/10 rounded-xl border border-[#F59E0B]/20">
                      <div className="text-[#F59E0B] text-3xl font-bold mb-2">
                        {blogAnalytics?.analytics?.overview?.totalComments || 0}
                      </div>
                      <div className="text-[#CFCFCF] text-sm font-medium">Total Comments</div>
                      <div className="text-[#F59E0B] text-xs mt-1">
                        {blogAnalytics?.analytics?.overview?.totalViews > 0 
                          ? ((blogAnalytics?.analytics?.overview?.totalComments || 0) / (blogAnalytics?.analytics?.overview?.totalViews || 1) * 100).toFixed(1)
                          : 0}% comment rate
                      </div>
                    </div>

                    <div className="text-center p-4 bg-[#00FFE0]/10 rounded-xl border border-[#00FFE0]/20">
                      <div className="text-[#00FFE0] text-3xl font-bold mb-2">
                        {blogAnalytics?.analytics?.overview?.totalViews > 0 && blogAnalytics?.analytics?.overview?.totalLikes > 0
                          ? (((blogAnalytics?.analytics?.overview?.totalLikes + blogAnalytics?.analytics?.overview?.totalComments) / blogAnalytics?.analytics?.overview?.totalViews) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-[#CFCFCF] text-sm font-medium">Engagement Rate</div>
                      <div className="text-[#00FFE0] text-xs mt-1">
                        (likes + comments) / views
                      </div>
                    </div>
                  </div>

                  {/* Engagement Trends Chart */}
                  <div className="mt-6">
                    <h4 className="text-[#F5F5F5] font-medium mb-4">Engagement Trends ({timeRange === '7' ? '7 days' : timeRange === '30' ? '30 days' : timeRange === '90' ? '90 days' : timeRange === '365' ? '1 year' : `${timeRange} days`})</h4>
                    <MultiLineChart data={blogAnalytics?.analytics?.dailyStats || []} timeRange={timeRange} blogAnalytics={blogAnalytics} />
                  </div>
                </div>

                {/* Blog Analytics Overview - 6 Cards in Single Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  <AnalyticsCard
                    title="Total Blog Posts"
                    value={blogAnalytics?.analytics?.overview?.totalPosts || 0}
                    change={0}
                    changeType="neutral"
                    icon={DocumentTextIcon}
                    color="text-[#B936F4]"
                    bgColor="from-[#B936F4]/20 to-[#8B5CF6]/20"
                  />
                  <AnalyticsCard
                    title="Published Posts"
                    value={blogAnalytics?.analytics?.overview?.publishedPosts || 0}
                    change={0}
                    changeType="neutral"
                    icon={CheckCircleIcon}
                    color="text-green-400"
                    bgColor="from-green-400/20 to-[#10B981]/20"
                  />
                  <AnalyticsCard
                    title="Pending Approval"
                    value={blogAnalytics?.analytics?.overview?.pendingPosts || 0}
                    change={0}
                    changeType="neutral"
                    icon={ClockIcon}
                    color="text-yellow-400"
                    bgColor="from-yellow-400/20 to-[#F59E0B]/20"
                  />
                  <AnalyticsCard
                    title="Draft Posts"
                    value={blogAnalytics?.analytics?.overview?.draftPosts || 0}
                    change={0}
                    changeType="neutral"
                    icon={PencilIcon}
                    color="text-[#CFCFCF]"
                    bgColor="from-[#CFCFCF]/20 to-[#9CA3AF]/20"
                  />
                  <AnalyticsCard
                    title="Blogs Rejected"
                    value={staffAnalytics?.analytics?.overview?.totalBlogsRejected || 0}
                    icon={XCircleIcon}
                    color="text-red-400"
                    bgColor="from-red-400/20 to-red-500/20"
                  />
                  <AnalyticsCard
                    title="Trash Recovery"
                    value={`${staffAnalytics?.analytics?.overview?.totalBlogsReposted || 0}/${staffAnalytics?.analytics?.overview?.totalBlogsTrashed || 0}`}
                    icon={ArrowPathIcon}
                    color="text-blue-400"
                    bgColor="from-blue-400/20 to-blue-500/20"
                  />
                </div>

                {/* Enhanced Blog Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-[#00FFE0]" />
                      Daily Blog Posts
                    </h3>
                    <TodaysBlogPosts posts={blogAnalytics?.analytics?.recentActivity || []} />
                  </div>

                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 text-[#10B981]" />
                      24-Hour Views
                    </h3>
    
                    <HourlyChart data={blogAnalytics?.analytics?.hourlyViews || []} />
                  </div>

                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <ChatBubbleLeftIcon className="w-5 h-5 text-[#F59E0B]" />
                      Daily Comments
                    </h3>
                    <TodaysComments comments={blogAnalytics?.analytics?.recentComments || []} />
                  </div>
                </div>

                {/* Enhanced Blog Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Top Posts (moved from bottom right) */}
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <StarIcon className="w-5 h-5 text-[#10B981]" />
                      Top Posts
                    </h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {blogAnalytics?.analytics?.topPosts?.byViews?.slice(0, 5).map((post, index) => (
                        <div key={post._id} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-[#10B981]/10 rounded-xl">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-[#10B981]/20 rounded-full flex items-center justify-center text-[#10B981] font-bold text-sm flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[#F5F5F5] font-medium truncate" title={post.title}>
                                {post.title}
                              </h4>
                              <p className="text-[#CFCFCF] text-sm">by {post.author?.name}</p>
                            </div>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <div className="text-[#10B981] text-sm font-medium">
                              {post.views || 0} views
                            </div>
                            <div className="text-[#CFCFCF] text-xs">
                              {post.likes || 0} likes
                            </div>
                          </div>
                        </div>
                      )) || <div className="text-center text-[#CFCFCF] py-4">No top posts</div>}
                    </div>
                  </div>

                  {/* Trending Categories (moved from bottom left to top right) */}
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <TagIcon className="w-5 h-5 text-[#B936F4]" />
                      Trending Categories
                    </h3>
                    <div className="space-y-4">
                      {blogAnalytics?.analytics?.categoryPerformance?.slice(0, 5).map((category, index) => (
                        <div key={category._id} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#B936F4]/20 rounded-full flex items-center justify-center text-[#B936F4] font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-[#F5F5F5] font-medium">{category.name}</h4>
                              <p className="text-[#CFCFCF] text-sm">{category.totalPosts} posts</p>
                            </div>
                          </div>
                          <div className="text-[#B936F4] font-semibold">
                            {category.totalViews || 0} views
                          </div>
                        </div>
                      )) || <div className="text-center text-[#CFCFCF] py-4">No data available</div>}
                    </div>
                  </div>
                </div>

                {/* Top Writers and Inactive Writers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Writers (moved from top right to bottom left) */}
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-[#F59E0B]" />
                      Top Writers
                    </h3>
                    <div className="space-y-4">
                      {writers?.slice(0, 5).map((writer, index) => (
                        <WriterRow key={writer._id} writer={writer} rank={index + 1} />
                      )) || <div className="text-center text-[#CFCFCF] py-4">No data available</div>}
                    </div>
                  </div>

                  {/* Inactive Writers (stays in bottom right) */}
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                      Inactive Writers ({staffAnalytics?.analytics?.inactiveWriters?.length || 0})
                    </h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {staffAnalytics?.analytics?.inactiveWriters?.slice(0, 5).map((writer) => (
                        <div key={writer._id} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-yellow-400/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            {writer.image && (
                              <img src={writer.image} alt={writer.name} className="w-8 h-8 rounded-full object-cover" />
                            )}
                            <div>
                              <h4 className="text-[#F5F5F5] font-medium">{writer.name}</h4>
                              <p className="text-[#CFCFCF] text-sm">{writer.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-yellow-400 text-sm font-medium">
                              {writer.daysSinceLastLogin} days
                            </div>
                            <div className="text-[#CFCFCF] text-xs">since login</div>
                          </div>
                        </div>
                      )) || <div className="text-center text-[#CFCFCF] py-4">No inactive writers</div>}
                    </div>
                  </div>
                </div>

                {/* Writer Performance Leaderboard */}
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[#F5F5F5] font-semibold flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-[#F59E0B]" />
                      Writer Performance Leaderboard
                    </h3>
                    <p className="text-[#CFCFCF] text-sm">All staff members from writing perspective</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#00FFE0]/10">
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Rank</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Writer</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Role</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Posts</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Views</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Likes</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Engagement</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#00FFE0]/10">
                        {(() => {
                          // Combine writers data with staff data to show all staff members from writing perspective
                          const allWritingStaff = [];
                          
                          // Add all writers from the writers array
                          if (writers && writers.length > 0) {
                            writers.forEach(writer => {
                              allWritingStaff.push({
                                ...writer,
                                actualRole: writer.role || 'writer',
                                totalPosts: writer.totalPosts || 0,
                                totalViews: writer.totalViews || 0,
                                totalLikes: writer.totalLikes || 0,
                                engagementRate: writer.engagementRate || 0
                              });
                            });
                          }
                          
                          // Add staff members who might not be in writers array but have written content
                          if (staffAnalytics?.analytics?.staffLeaderboard) {
                            staffAnalytics.analytics.staffLeaderboard.forEach(staff => {
                              // Check if this staff member is already in the writers array
                              const existingWriter = allWritingStaff.find(w => w._id === staff._id);
                              if (!existingWriter) {
                                // Add staff member with their writing stats (if any)
                                allWritingStaff.push({
                                  _id: staff._id,
                                  name: staff.name,
                                  email: staff.email,
                                  image: staff.image,
                                  actualRole: staff.role,
                                  totalPosts: staff.blogsCreated || 0,
                                  totalViews: 0, // Staff analytics might not have view data
                                  totalLikes: 0, // Staff analytics might not have like data
                                  engagementRate: 0
                                });
                              }
                            });
                          }
                          
                          // Sort by total posts (primary) and then by total views (secondary)
                          allWritingStaff.sort((a, b) => {
                            if (b.totalPosts !== a.totalPosts) {
                              return b.totalPosts - a.totalPosts;
                            }
                            return b.totalViews - a.totalViews;
                          });
                          
                          return allWritingStaff.map((writer, index) => (
                            <tr key={writer._id} className="hover:bg-[#00FFE0]/5 transition-colors">
                              <td className="py-3 px-4">
                                <div className="w-8 h-8 bg-[#F59E0B]/20 rounded-full flex items-center justify-center text-[#F59E0B] font-bold text-sm">
                                  {index + 1}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  {writer.image && (
                                    <img src={writer.image} alt={writer.name} className="w-8 h-8 rounded-full object-cover" />
                                  )}
                                  <div>
                                    <div className="text-[#F5F5F5] font-medium">{writer.name}</div>
                                    <div className="text-[#CFCFCF] text-sm">{writer.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  writer.actualRole === 'admin' ? 'bg-[#B936F4]/20 text-[#B936F4]' :
                                  writer.actualRole === 'manager' ? 'bg-[#FF6B35]/20 text-[#FF6B35]' :
                                  'bg-[#4ECDC4]/20 text-[#4ECDC4]'
                                }`}>
                                  {writer.actualRole?.charAt(0).toUpperCase() + writer.actualRole?.slice(1) || 'Writer'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[#00FFE0] font-bold text-lg">{writer.totalPosts}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[#10B981] font-bold text-lg">{writer.totalViews}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[#B936F4] font-bold text-lg">{writer.totalLikes}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[#F59E0B] font-bold text-lg">{writer.engagementRate}%</div>
                              </td>
                              <td className="py-3 px-4">
                                <Link
                                  href={`/admin/analytics/writer/${writer._id}`}
                                  onClick={() => {
                                    // Save current state before navigation
                                    sessionStorage.setItem('admin-analytics-active-tab', 'blogs');
                                    sessionStorage.setItem('admin-analytics-scroll-position', window.scrollY.toString());
                                    sessionStorage.setItem('admin-analytics-returning', 'true');
                                  }}
                                  className="text-[#00FFE0] hover:text-[#00FFE0]/80 text-sm font-medium transition-colors"
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          ));
                        })()}
                        {(() => {
                          // Check if we have any data to display
                          const hasWriters = writers && writers.length > 0;
                          const hasStaff = staffAnalytics?.analytics?.staffLeaderboard && staffAnalytics.analytics.staffLeaderboard.length > 0;
                          
                          if (!hasWriters && !hasStaff) {
                            return (
                              <tr>
                                <td colSpan="8" className="text-center text-[#CFCFCF] py-8">No writers data available</td>
                              </tr>
                            );
                          }
                          return null;
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Staff Analysis Tab */}
            {activeTab === 'staff' && (
              <>
                {!dataLoaded.staff && (
                  <div className="flex items-center justify-center h-64 mb-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981] mx-auto mb-4"></div>
                      <p className="text-[#CFCFCF]">Loading staff analytics...</p>
                    </div>
                  </div>
                )}
                
                {/* Staff Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <AnalyticsCard
                    title="Total Staff Members"
                    value={staffAnalytics?.analytics?.overview?.totalStaff || 0}
                    icon={UserIcon}
                    color="text-[#00FFE0]"
                    bgColor="from-[#00FFE0]/20 to-[#00D4AA]/20"
                  />
                  <AnalyticsCard
                    title="Active This Month"
                    value={staffAnalytics?.analytics?.overview?.activeStaffThisMonth || 0}
                    icon={CheckCircleIcon}
                    color="text-green-400"
                    bgColor="from-green-400/20 to-[#10B981]/20"
                  />
                  <AnalyticsCard
                    title="Total Moderation Actions"
                    value={staffAnalytics?.analytics?.overview?.totalModerationActions || 0}
                    icon={ShieldCheckIcon}
                    color="text-[#B936F4]"
                    bgColor="from-[#B936F4]/20 to-[#8B5CF6]/20"
                  />
                  <AnalyticsCard
                    title="Avg Decision Impact"
                    value={staffAnalytics?.analytics?.overview?.avgDecisionImpact?.toFixed(1) || '0.0'}
                    icon={TrophyIcon}
                    color="text-[#F59E0B]"
                    bgColor="from-[#F59E0B]/20 to-[#D97706]/20"
                  />
                </div>

                {/* Staff Activity Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-[#B936F4]" />
                      Writers ({staffAnalytics?.analytics?.roleStats?.writer?.count || 0})
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">Blog Posts</span>
                        <span className="text-[#B936F4] font-semibold">{staffAnalytics?.analytics?.roleStats?.writer?.blogs || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">Avg per Writer</span>
                        <span className="text-[#CFCFCF] font-semibold">{staffAnalytics?.analytics?.roleStats?.writer?.avgBlogsPerWriter || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">Total Reviews</span>
                        <span className="text-[#CFCFCF] font-semibold">{staffAnalytics?.analytics?.roleStats?.writer?.reviews || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5 text-[#10B981]" />
                      Managers ({staffAnalytics?.analytics?.roleStats?.manager?.count || 0})
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">Moderation Actions</span>
                        <span className="text-[#10B981] font-semibold">{staffAnalytics?.analytics?.roleStats?.manager?.moderationActions || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">Tools Managed</span>
                        <span className="text-[#CFCFCF] font-semibold">{staffAnalytics?.analytics?.roleStats?.manager?.toolsManaged || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">User Actions</span>
                        <span className="text-[#CFCFCF] font-semibold">{staffAnalytics?.analytics?.roleStats?.manager?.userActions || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-[#F59E0B]" />
                      Admins ({staffAnalytics?.analytics?.roleStats?.admin?.count || 0})
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">System Actions</span>
                        <span className="text-[#F59E0B] font-semibold">{staffAnalytics?.analytics?.roleStats?.admin?.systemActions || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">User Management</span>
                        <span className="text-[#CFCFCF] font-semibold">{staffAnalytics?.analytics?.roleStats?.admin?.userManagement || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#CFCFCF]">Platform Config</span>
                        <span className="text-[#CFCFCF] font-semibold">{staffAnalytics?.analytics?.roleStats?.admin?.platformConfig || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Decision Impact Leaders */}
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-[#F59E0B]" />
                      Top Decision Impact Scores
                    </h3>
                    <div className="space-y-4">
                      {staffAnalytics?.analytics?.staffLeaderboard?.slice(0, 5).map((staff, index) => (
                        <div key={staff._id} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#F59E0B]/20 rounded-full flex items-center justify-center text-[#F59E0B] font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex items-center gap-3">
                              {staff.image && (
                                <img src={staff.image} alt={staff.name} className="w-8 h-8 rounded-full object-cover" />
                              )}
                              <div>
                                <h4 className="text-[#F5F5F5] font-medium">{staff.name}</h4>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  staff.role === 'admin' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                                  staff.role === 'manager' ? 'bg-[#10B981]/20 text-[#10B981]' :
                                  'bg-[#B936F4]/20 text-[#B936F4]'
                                }`}>
                                  {staff.role}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#F59E0B] font-bold text-lg">
                              {staff.decisionImpactScore}
                            </div>
                            <div className="text-[#CFCFCF] text-xs">impact score</div>
                          </div>
                        </div>
                      )) || <div className="text-center text-[#CFCFCF] py-4">No data available</div>}
                    </div>
                  </div>

                  {/* Login Frequency Analysis */}
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                    <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-[#00FFE0]" />
                      Login Frequency Distribution
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(staffAnalytics?.analytics?.loginFrequency || {}).map(([frequency, count]) => {
                        const getFrequencyColor = (freq) => {
                          switch (freq) {
                            case 'Very Active': return 'text-green-400 bg-green-400/20';
                            case 'Active': return 'text-[#00FFE0] bg-[#00FFE0]/20';
                            case 'Moderate': return 'text-yellow-400 bg-yellow-400/20';
                            case 'Inactive': return 'text-red-400 bg-red-400/20';
                            default: return 'text-[#CFCFCF] bg-[#CFCFCF]/20';
                          }
                        };

                        return (
                          <div key={frequency} className="flex items-center justify-between p-3 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getFrequencyColor(frequency)}`}>
                                {frequency}
                              </span>
                            </div>
                            <div className="text-[#F5F5F5] font-semibold">
                              {count} staff
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Staff Leaderboard Table */}
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[#F5F5F5] font-semibold flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Staff Performance Leaderboard
                    </h3>
                    <div className="flex gap-2">
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] text-sm focus:border-[#00FFE0] focus:outline-none"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="manager">Managers</option>
                        <option value="writer">Writers</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#00FFE0]/10">
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Rank</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Staff Member</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Role</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Blogs Created</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Moderation Actions</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Decision Impact</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Activity Score</th>
                          <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#00FFE0]/10">
                        {filteredStaffData.map((staff, index) => (
                          <tr key={staff._id} className="hover:bg-[#00FFE0]/5 transition-colors">
                            <td className="py-3 px-4">
                              <div className="w-8 h-8 bg-[#F59E0B]/20 rounded-full flex items-center justify-center text-[#F59E0B] font-bold text-sm">
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {staff.image && (
                                  <img src={staff.image} alt={staff.name} className="w-8 h-8 rounded-full object-cover" />
                                )}
                                <div>
                                  <div className="text-[#F5F5F5] font-medium">{staff.name}</div>
                                  <div className="text-[#CFCFCF] text-sm">{staff.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                staff.role === 'admin' ? 'bg-[#B936F4]/20 text-[#B936F4]' :
                                staff.role === 'manager' ? 'bg-[#FF6B35]/20 text-[#FF6B35]' :
                                'bg-[#4ECDC4]/20 text-[#4ECDC4]'
                              }`}>
                                {staff.role?.charAt(0).toUpperCase() + staff.role?.slice(1) || 'Staff'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-[#00FFE0] font-bold text-lg">{staff.blogsCreated || 0}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-[#10B981] font-bold text-lg">{staff.totalModerationActions || 0}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className={`font-bold text-lg ${staff.decisionImpactScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {staff.decisionImpactScore > 0 ? '+' : ''}{staff.decisionImpactScore || 0}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-[#F59E0B] font-bold text-lg">{Math.round(staff.totalActivity || 0)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                href={`/admin/staff/${staff._id}`}
                                onClick={() => {
                                  // Save current state before navigation
                                  sessionStorage.setItem('admin-analytics-active-tab', 'staff');
                                  sessionStorage.setItem('admin-analytics-scroll-position', window.scrollY.toString());
                                  sessionStorage.setItem('admin-analytics-returning', 'true');
                                }}
                                className="text-[#00FFE0] hover:text-[#00FFE0]/80 text-sm font-medium transition-colors"
                              >
                                View More
                              </Link>
                            </td>
                          </tr>
                        ))}
                        {filteredStaffData.length === 0 && (
                          <tr>
                            <td colSpan="8" className="text-center text-[#CFCFCF] py-8">No staff data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>



                {/* Recent Staff Activity */}
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[#F5F5F5] font-semibold flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-[#B936F4]" />
                      Recent Staff Activity
                      <span className="text-sm text-[#CFCFCF] font-normal ml-2">
                        ({filteredActivities.length} activities)
                      </span>
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={exportActivityToCSV}
                        disabled={filteredActivities.length === 0}
                        className="flex items-center gap-2 px-3 py-2 bg-[#10B981]/20 text-[#10B981] rounded-lg hover:bg-[#10B981]/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export activity data to CSV"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-[#0A0F24]/20 rounded-xl border border-[#00FFE0]/5">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                      <input
                        type="text"
                        placeholder="Search staff, actions, descriptions..."
                        value={activitySearchTerm}
                        onChange={(e) => setActivitySearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] placeholder-[#CFCFCF] text-sm focus:border-[#00FFE0] focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="relative">
                      <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                      <select
                        value={activityTypeFilter}
                        onChange={(e) => setActivityTypeFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] text-sm focus:border-[#00FFE0] focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="all">All Activity Types</option>
                        <option value="user_management">User Management</option>
                        <option value="blog_management">Blog Management</option>
                        <option value="tool_management">Tool Management</option>
                        <option value="review_management">Review Management</option>
                        <option value="system">System</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF] pointer-events-none" />
                    </div>

                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                      <select
                        value={activityRoleFilter}
                        onChange={(e) => setActivityRoleFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] text-sm focus:border-[#00FFE0] focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="writer">Writer</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF] pointer-events-none" />
                    </div>

                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                      <select
                        value={activityTimeRange}
                        onChange={(e) => setActivityTimeRange(parseInt(e.target.value))}
                        className="w-full pl-10 pr-8 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] text-sm focus:border-[#00FFE0] focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="1">Last 24 Hours</option>
                        <option value="3">Last 3 Days</option>
                        <option value="7">Last 7 Days</option>
                        <option value="14">Last 14 Days</option>
                        <option value="30">Last 30 Days</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF] pointer-events-none" />
                    </div>
                  </div>

                  {/* Activity Table */}
                  <div className="overflow-hidden rounded-xl border border-[#00FFE0]/10">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#0A0F24]/50 border-b border-[#00FFE0]/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#CFCFCF] uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#CFCFCF] uppercase tracking-wider">
                              Staff Member
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#CFCFCF] uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#CFCFCF] uppercase tracking-wider">
                              Entity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#CFCFCF] uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-[#CFCFCF] uppercase tracking-wider">
                              Details
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#00FFE0]/10">
                          {filteredActivities.length > 0 ? (
                            filteredActivities.map((activity, index) => (
                              <ActivityTableRow
                                key={`${activity.staffId}-${activity.timestamp}-${index}`}
                                activity={activity}
                                index={index}
                              />
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-4 py-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-12 h-12 bg-[#CFCFCF]/10 rounded-full flex items-center justify-center">
                                    <ClockIcon className="w-6 h-6 text-[#CFCFCF]" />
                                  </div>
                                  <div className="text-[#CFCFCF] text-sm">
                                    No activity found for the selected filters
                                  </div>
                                  <button
                                    onClick={() => {
                                      setActivitySearchTerm('');
                                      setActivityTypeFilter('all');
                                      setActivityRoleFilter('all');
                                      setActivityTimeRange(7);
                                    }}
                                    className="text-[#00FFE0] text-sm hover:text-[#00D4AA] transition-colors"
                                  >
                                    Clear filters
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {filteredActivities.length > 100 && (
                    <div className="mt-4 text-center">
                      <div className="text-[#CFCFCF] text-sm">
                        Showing all {filteredActivities.length} activities
                      </div>
                      <button
                        onClick={exportActivityToCSV}
                        className="mt-2 text-[#00FFE0] text-sm hover:text-[#00D4AA] transition-colors"
                        title="Export activity data to CSV"
                      >
                        Export CSV
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 