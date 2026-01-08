# PPT Styling Customization Guide

## Quick Overview

All PPT styling is controlled in `src/pages/ReportView.jsx` in the `handleDownloadPPTX` function (around line 523).

## Main Styling Areas

### 1. Color Palette (Lines 523-529)

Current navy blue theme:
```javascript
const navyBlue = '001F3F'        // Primary navy #001F3F
const navyBlueLight = '003D7A'   // Lighter navy #003D7A
const navyBlueAccent = '0052A3'  // Accent navy #0052A3
const navyBlueDark = '000F1F'    // Dark navy for contrast
const textGray = '2C3E50'        // Dark gray for body text
const lightGray = 'F5F7FA'       // Light gray background
```

**To change colors:**
- Replace hex codes (without #)
- Colors are in RGB hex format: `RRGGBB`
- Example: `'FF5733'` = Red, `'2ECC71'` = Green

### 2. Font Settings

**Title Slide (Lines 700-721):**
- Main title: `fontSize: 44`, `fontFace: 'Arial'`
- Subtitle: `fontSize: 20`, `fontFace: 'Arial'`

**Content Slides (Lines 591-602, 638-649):**
- Slide title: `fontSize: 22`, `fontFace: 'Arial'`
- Bullet text: `fontSize: 14`, `fontFace: 'Arial'`

**To change fonts:**
- Change `fontFace` to: `'Calibri'`, `'Times New Roman'`, `'Georgia'`, `'Verdana'`, etc.
- Adjust `fontSize` (numbers only, no 'px')

### 3. Layout Dimensions

**Slide Size (Line 521):**
```javascript
pptx.layout = 'LAYOUT_WIDE' // 16:9 aspect ratio
```

**Options:**
- `'LAYOUT_WIDE'` - 16:9 (10" x 5.625")
- `'LAYOUT_4x3'` - 4:3 (10" x 7.5")
- `'LAYOUT_16x10'` - 16:10

### 4. Header Bar Height (Line 562)

```javascript
h: 0.8,  // Header bar height (inches)
```

### 5. Decorative Elements

**Slide Number Badge (Lines 568-588):**
- Circle size: `w: 0.4, h: 0.4`
- Position: `x: 0.3, y: 0.2`

**Icon Shapes (Lines 627-635):**
- Triangle size: `w: 0.12, h: 0.12`
- Color: `navyBlueAccent`

## Popular Color Schemes

### Professional Blue (Current)
```javascript
const primary = '001F3F'    // Navy
const accent = '0052A3'     // Blue
const text = '2C3E50'       // Dark gray
```

### Modern Purple
```javascript
const primary = '6C5CE7'    // Purple
const accent = 'A29BFE'     // Light purple
const text = '2D3436'       // Dark gray
```

### Corporate Green
```javascript
const primary = '00B894'    // Teal green
const accent = '00CEC9'     // Cyan
const text = '2D3436'       // Dark gray
```

### Bold Red
```javascript
const primary = 'D63031'    // Red
const accent = 'E17055'     // Coral
const text = '2D3436'       // Dark gray
```

### Elegant Dark
```javascript
const primary = '2D3436'    // Dark gray
const accent = '636E72'     // Medium gray
const text = '2D3436'       // Dark gray
```

## Step-by-Step: Change Color Scheme

1. **Open** `src/pages/ReportView.jsx`
2. **Find** line 523 (color palette section)
3. **Replace** the color values:
   ```javascript
   const navyBlue = 'YOUR_PRIMARY_COLOR'      // Without #
   const navyBlueLight = 'YOUR_LIGHT_COLOR'
   const navyBlueAccent = 'YOUR_ACCENT_COLOR'
   ```
4. **Save** and test

## Step-by-Step: Change Font

1. **Find** all `fontFace: 'Arial'` instances
2. **Replace** with your preferred font:
   ```javascript
   fontFace: 'Calibri'  // or 'Times New Roman', 'Georgia', etc.
   ```
3. **Save** and test

## Step-by-Step: Change Layout

1. **Find** line 521: `pptx.layout = 'LAYOUT_WIDE'`
2. **Change** to:
   ```javascript
   pptx.layout = 'LAYOUT_4x3'  // For 4:3 aspect ratio
   ```
3. **Save** and test

## Advanced Customization

### Change Title Slide Background

**Find** lines 680-687:
```javascript
titleSlide.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: 10, h: 5.625,
  fill: { color: navyBlue },  // Change this color
})
```

### Change Header Bar Style

**Find** lines 558-565:
```javascript
slideObj.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: 10, h: 0.8,
  fill: { color: navyBlue },  // Change color
  // Add gradient or pattern here if needed
})
```

### Remove/Modify Decorative Elements

**To remove slide number badge:**
- Comment out or delete lines 568-588

**To change icon shape:**
- Line 627: Change `pptx.ShapeType.triangle` to:
  - `pptx.ShapeType.rect` (square)
  - `pptx.ShapeType.ellipse` (circle)
  - `pptx.ShapeType.roundRect` (rounded square)

## Testing Your Changes

1. Make your styling changes
2. Save the file
3. Refresh your app (if dev server is running)
4. Generate a PPT from any report
5. Open the downloaded PPTX file
6. Review and adjust as needed

## Tips

- **Color Contrast**: Ensure text is readable (dark text on light background, light text on dark)
- **Consistency**: Use the same color palette throughout
- **Font Legibility**: Arial, Calibri, and Helvetica are most readable
- **Spacing**: Adjust `y` and `h` values to change vertical spacing
- **Width**: Adjust `w` values to change horizontal spacing

## Need Help?

Check the `pptxgenjs` documentation: https://gitbrent.github.io/PptxGenJS/

