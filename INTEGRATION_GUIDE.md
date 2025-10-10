# Step-by-Step Builder Integration Guide

## Current Status

The Step-by-Step Writing Builder has been **created** but not yet **integrated** into the existing interface.

### Files Created
- ✅ `/src/config/writingStages.ts` - Complete configuration
- ✅ `/src/components/StepByStepWritingBuilder.tsx` - Component ready
- ✅ Documentation files

### What You See Now
Based on your screenshot, the current interface shows:
- Toolbar with: **Plan | Structure | Tips | Exam | Focus**
- Writing area (left)
- Writing Coach panel (right)

## Integration Options

### Option 1: Add as New Toolbar Button (Recommended)

Add a "**Builder**" or "**Step Guide**" button next to Plan/Structure/Tips.

**Where to integrate:**
Find the file that renders those toolbar buttons (likely `EnhancedWritingLayoutNSW.tsx` or similar) and add:

```tsx
import { StepByStepWritingBuilder } from './StepByStepWritingBuilder';
import { useState } from 'react';

// Inside your component:
const [showStepBuilder, setShowStepBuilder] = useState(false);

// Add button to toolbar:
<button onClick={() => setShowStepBuilder(!showStepBuilder)}>
  Step Guide
</button>

// Add modal or panel to show builder:
{showStepBuilder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Step-by-Step Writing Guide</h2>
        <button onClick={() => setShowStepBuilder(false)} className="text-2xl">&times;</button>
      </div>
      <div className="p-6">
        <StepByStepWritingBuilder
          textType={textType}
          content={content}
        />
      </div>
    </div>
  </div>
)}
```

### Option 2: Replace "Structure" Button

The "Structure" button could show the Step-by-Step Builder since it provides structural guidance.

### Option 3: Add to Writing Coach Panel

Add a third tab to the Writing Coach panel (AI Coach | NSW Criteria | **Step Guide**)

```tsx
// In your coach panel component:
<Tabs>
  <Tab label="AI Coach">
    {/* existing coach */}
  </Tab>
  <Tab label="NSW Criteria">
    {/* existing criteria */}
  </Tab>
  <Tab label="Step Guide">
    <StepByStepWritingBuilder
      textType={textType}
      content={content}
    />
  </Tab>
</Tabs>
```

### Option 4: Side Panel Toggle

Add a toggle button that shows/hides a side panel with the builder:

```tsx
<button onClick={() => setShowBuilder(!showBuilder)}>
  {showBuilder ? 'Hide' : 'Show'} Step Guide
</button>

{showBuilder && (
  <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg overflow-y-auto z-40">
    <StepByStepWritingBuilder
      textType={textType}
      content={content}
    />
  </div>
)}
```

## Quick Integration Steps

### Step 1: Find the Main Layout File

The file that renders your writing interface. Likely one of:
- `/src/pages/WritingWorkspace.tsx`
- `/src/components/EnhancedWritingLayoutNSW.tsx`
- `/src/components/EnhancedWritingLayout.tsx`

### Step 2: Import the Component

At the top of that file:
```tsx
import { StepByStepWritingBuilder } from '../components/StepByStepWritingBuilder';
```

### Step 3: Add State (if using modal/toggle)

```tsx
const [showStepBuilder, setShowStepBuilder] = useState(false);
```

### Step 4: Add Button to Toolbar

Find where the Plan/Structure/Tips buttons are defined and add:
```tsx
<button
  onClick={() => setShowStepBuilder(true)}
  className="your-existing-button-classes"
>
  📝 Step Guide
</button>
```

### Step 5: Render the Builder

Choose your preferred display method from options above.

## Testing

After integration:

1. Click the "Step Guide" button
2. Select text type: "narrative"
3. You should see 6 stages
4. Stage 1 (Opening) should be expanded
5. You should see specific prompts like:
   - "Who is your main character?"
   - "Where and when does your story take place?"

## Example: Full Modal Integration

```tsx
import { StepByStepWritingBuilder } from '../components/StepByStepWritingBuilder';
import { useState } from 'react';

function YourWritingComponent() {
  const [showStepBuilder, setShowStepBuilder] = useState(false);
  const [content, setContent] = useState('');
  const [textType, setTextType] = useState('narrative');

  return (
    <div>
      {/* Your existing toolbar */}
      <div className="toolbar">
        <button onClick={() => setShowStepBuilder(true)}>
          📝 Step Guide
        </button>
        {/* other buttons */}
      </div>

      {/* Your existing writing area and coach */}
      {/* ... */}

      {/* Step Builder Modal */}
      {showStepBuilder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setShowStepBuilder(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <h2 className="text-xl font-bold">Step-by-Step Writing Guide</h2>
              <button
                onClick={() => setShowStepBuilder(false)}
                className="text-3xl hover:bg-white/20 rounded px-2"
              >
                &times;
              </button>
            </div>

            {/* Builder Content */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <StepByStepWritingBuilder
                textType={textType}
                content={content}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## What Students Will See

When they click the Step Guide button:

1. **Modal/panel opens** with title "Step-by-Step Writing Guide"
2. **Progress bar** showing 0/6 stages complete
3. **Stage 1 expanded** with:
   - 🎯 Objectives
   - 📋 4-5 specific prompts/questions
   - 💡 Writing tips
   - 📝 Example sentences
   - Word count: 0/40 words
4. **Navigation buttons**: Next Step →
5. As they write, **stages auto-complete** and advance

## Need Help Finding the File?

Run these commands to locate where to integrate:

```bash
# Find files with toolbar buttons:
grep -r "Plan.*button\|Structure.*button" src/

# Or find main layout files:
find src -name "*Layout*.tsx" -o -name "*Workspace*.tsx"

# Look for the file that matches your screenshot
```

## Support

- Full technical docs: `WRITING_BUILDER_IMPLEMENTATION.md`
- Quick reference: `STEP_BY_STEP_BUILDER_QUICKSTART.md`
- Configuration: `src/config/writingStages.ts`
- Component: `src/components/StepByStepWritingBuilder.tsx`

## Next Steps

1. **Locate** your main writing interface file
2. **Choose** integration method (modal recommended)
3. **Add** import and button
4. **Test** with narrative writing type
5. **Enjoy** student-friendly step-by-step guidance!

---

**The component is ready - it just needs to be connected to your existing UI!**
