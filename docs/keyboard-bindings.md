# Keyboard Bindings System Documentation

A comprehensive keyboard bindings system for enhanced user experience and accessibility.

## 🚀 Features

### ✅ Smart Context Awareness
- Automatically disables shortcuts when typing in input fields
- Respects native browser behavior for form elements  
- Mobile-friendly (shortcuts don't interfere with touch devices)

### ✅ Visual Feedback
- Provides visual feedback when shortcuts are activated
- Enhanced focus states for keyboard navigation
- Smooth animations for user interactions

### ✅ Accessibility First
- Supports screen readers and assistive technologies
- Maintains proper focus management
- Implements ARIA patterns for complex components

## ⌨️ Available Shortcuts

### Form Interactions
- **Enter** → Submit active form (when focused on input fields)

### Navigation  
- **↑ ↓** → Smooth page scrolling
- **← →** → Navigate carousel slides, tabs, or dropdown items
- **Tab** → Move to next focusable element
- **Shift+Tab** → Move to previous focusable element

### Modal & Dropdown Management
- **Escape** → Close modals, dropdowns, or clear search inputs

### Search
- **Ctrl+F** → Focus search input or open search modal

## 🛠️ Implementation Guide

### Basic Integration

The system is automatically enabled through the provider in your layout:

```jsx
// Already integrated in src/app/layout.js
<KeyboardBindingsProvider>
  {/* Your app content */}
</KeyboardBindingsProvider>
```

### Form Support

```jsx
// ✅ Works with Enter key submission
<form onSubmit={handleSubmit}>
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### Modal Support

```jsx
// ✅ Works with Escape key
<div role="dialog" aria-modal="true">
  <h2>Modal Title</h2>
  <button data-modal-close>Close</button>
</div>
```

### Carousel Support

```jsx
// ✅ Works with arrow keys
<div data-carousel>
  <button data-carousel-prev>Previous</button>
  <button data-carousel-next>Next</button>
</div>
```

### Tab Navigation

```jsx
// ✅ Works with arrow keys when focused
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
```

## 🎨 Visual Feedback Classes

```css
.keyboard-focus    /* Applied on keyboard focus */
.keyboard-activate /* Applied on keyboard activation */
```

## 🌐 Browser Support

- ✅ Chrome 88+
- ✅ Firefox 85+  
- ✅ Safari 14+
- ✅ Edge 88+
- ⚠️ Mobile (limited keyboard support)

## 📱 Mobile Considerations

The system automatically detects mobile devices and disables shortcuts to prevent interference with touch interactions.

## 🔧 Testing

Test the keyboard bindings on any page of your website - they work automatically on forms, modals, and navigation elements.

## 📋 Attribute Reference

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `role="dialog"` | Modal identification | `<div role="dialog">` |
| `data-modal-close` | Close button | `<button data-modal-close>` |
| `data-carousel` | Carousel container | `<div data-carousel>` |
| `data-carousel-prev` | Previous button | `<button data-carousel-prev>` |
| `data-carousel-next` | Next button | `<button data-carousel-next>` |
| `data-search-trigger` | Search button | `<button data-search-trigger>` |
| `role="tablist"` | Tab container | `<div role="tablist">` |
| `role="tab"` | Tab button | `<button role="tab">` |

This system enhances your website's usability while maintaining full accessibility compliance. 