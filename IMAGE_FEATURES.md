# Image Upload & Grid Layout Features

## Overview
The editor now supports advanced image handling with resizing capabilities and responsive grid layouts.

## Features

### 1. **Single Image Upload with Resize**
- Click the **image icon** in the toolbar to upload a single image
- After insertion, **click on any image** to select it
- A resize control panel appears at the bottom of the screen
- Enter width values like:
  - `500px` - Fixed pixel width
  - `50%` - Percentage of container
  - `800` - Will be converted to px automatically
- Click **Apply** to resize the image
- Click the **X** or press **Escape** to deselect

### 2. **Image Grid Layout**
- Click the **grid icon** in the toolbar (next to the image icon)
- Select **multiple images** from your file picker
- A modal appears showing:
  - Preview of all selected images
  - Grid column options (2, 3, or 4 columns)
  - Number of images selected
- Choose your desired column layout
- Click **Insert Grid** to upload and insert all images as a grid
- The grid is **automatically responsive**:
  - Desktop: Shows your selected column count
  - Tablet (≤768px): 4-column grids become 2-column, 3-column becomes 2-column
  - Mobile (≤480px): All grids become single column

### 3. **Responsive Behavior**
All image grids automatically adapt to screen size:
- **Desktop**: Full grid layout (2, 3, or 4 columns)
- **Tablet**: Reduced to 2 columns max
- **Mobile**: Single column layout

## Technical Implementation

### Custom TipTap Extension
- Located at: `src/lib/extensions/ResizableImage.ts`
- Extends the base Image extension
- Adds `width`, `height`, and `gridColumns` attributes
- Supports both single images and grid containers

### Styling
- Images have cursor pointer and smooth transitions
- Selected images show black outline with shadow
- Grid images maintain aspect ratio (1:1) with object-fit cover
- Rounded corners and gap spacing for visual appeal

## Usage Tips

1. **For single hero images**: Upload individually and resize to 100% for full width
2. **For galleries**: Use the grid feature with 3-4 columns on desktop
3. **For side-by-side comparisons**: Use 2-column grid
4. **For optimal mobile experience**: The responsive grid handles everything automatically

## Keyboard Shortcuts
- **Escape**: Deselect currently selected image
