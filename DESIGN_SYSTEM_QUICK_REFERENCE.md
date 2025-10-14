# Design System Quick Reference

## Color Variables (CSS)

### Primary Gradients
```css
--gradient-primary: linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)
--gradient-success: linear-gradient(135deg, #06B6D4 0%, #10B981 100%)
--gradient-feature: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)
--gradient-hero: linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #EC4899 100%)
```

### Tailwind Classes (Most Common)

#### Buttons
```html
<!-- Primary Button -->
<button class="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-3 rounded-xl">
  Click Me
</button>

<!-- Secondary Button -->
<button class="bg-gradient-to-r from-teal-500 to-green-500 text-white px-8 py-3 rounded-xl">
  Secondary Action
</button>

<!-- Outline Button -->
<button class="bg-white border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-xl">
  Outline Button
</button>
```

#### Cards
```html
<!-- Standard Card -->
<div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
  Card Content
</div>

<!-- Gradient Top Card -->
<div class="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-hidden">
  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-700"></div>
  Card Content
</div>
```

#### Stat Cards
```html
<div class="text-center">
  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
    <Icon class="h-6 w-6 text-white" />
  </div>
  <p class="text-3xl font-bold text-slate-900">12</p>
  <p class="text-sm text-slate-600">Label</p>
</div>
```

#### Progress Bars
```html
<div class="w-full h-2 bg-slate-200 rounded-full">
  <div class="h-full bg-gradient-to-r from-blue-600 to-purple-700 rounded-full" style="width: 68%"></div>
</div>
```

#### Modals
```html
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
  <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-12 border border-slate-200">
    <h2 class="text-2xl font-bold text-purple-700 mb-4">Modal Title</h2>
    <p class="text-slate-600 mb-6">Modal content</p>
    <button class="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-xl">
      Action
    </button>
  </div>
</div>
```

## Spacing Scale

```
xs:  4px   (space-x-1, p-1)
sm:  8px   (space-x-2, p-2)
md:  16px  (space-x-4, p-4)
lg:  24px  (space-x-6, p-6)
xl:  32px  (space-x-8, p-8)
2xl: 48px  (space-x-12, p-12)
```

## Border Radius

```
sm:  8px   (rounded-lg)
md:  12px  (rounded-xl)
lg:  16px  (rounded-2xl)
xl:  20px  (rounded-[20px])
2xl: 24px  (rounded-[24px])
full: 9999px (rounded-full)
```

## Typography Scale

```
xs:  12px  (text-xs)
sm:  14px  (text-sm)
base: 16px  (text-base)
lg:  18px  (text-lg)
xl:  20px  (text-xl)
2xl: 24px  (text-2xl)
3xl: 30px  (text-3xl)
4xl: 36px  (text-4xl)
5xl: 48px  (text-5xl)
```

## Color Codes by Writing Type

```
Narrative:     Blue    (#3B82F6)  bg-blue-500
Persuasive:    Red     (#EF4444)  bg-red-500
Expository:    Green   (#10B981)  bg-green-500
Reflective:    Pink    (#EC4899)  bg-pink-500
Descriptive:   Purple  (#7C3AED)  bg-purple-600
Recount:       Orange  (#F59E0B)  bg-orange-500
Advertisement: Amber   (#F59E0B)  bg-amber-500
Advice:        Cyan    (#14B8A6)  bg-cyan-600
Diary:         Indigo  (#6366F1)  bg-indigo-500
Discussion:    Teal    (#06B6D4)  bg-teal-500
Guide:         Lime    (#84CC16)  bg-lime-500
Letter:        Sky     (#0EA5E9)  bg-sky-500
```

## Icon Backgrounds (Soft Gradients)

```html
<!-- Blue Icon -->
<div class="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 p-3 rounded-xl">
  <Icon />
</div>

<!-- Purple Icon -->
<div class="bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 p-3 rounded-xl">
  <Icon />
</div>

<!-- Green Icon -->
<div class="bg-gradient-to-br from-green-100 to-green-200 text-green-600 p-3 rounded-xl">
  <Icon />
</div>

<!-- Pink Icon -->
<div class="bg-gradient-to-br from-pink-100 to-pink-200 text-pink-600 p-3 rounded-xl">
  <Icon />
</div>
```

## Common Patterns

### Action Card (Dashboard)
```html
<div class="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 cursor-pointer hover:scale-105 transition-transform">
  <div class="flex items-center justify-between mb-6">
    <div class="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
      <Icon class="h-8 w-8 text-white" />
    </div>
    <ArrowRight class="h-6 w-6 text-white/70" />
  </div>
  <h2 class="text-2xl font-bold text-white mb-3">Title</h2>
  <p class="text-blue-100 text-lg">Description</p>
</div>
```

### Badge
```html
<!-- Popular Badge -->
<span class="bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
  ⭐ Popular
</span>
```

### Info Box
```html
<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-900">
  ℹ️ Information message here
</div>
```

## Hover Effects

```css
/* Standard Hover */
hover:scale-105 hover:shadow-lg transition-all

/* Lift Hover */
hover:-translate-y-2 hover:shadow-lg transition-all

/* Glow Hover */
hover:shadow-2xl hover:shadow-purple-500/50 transition-all
```

## Focus States

```css
focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2
```

## Dark Mode Classes

```html
<!-- Background -->
class="bg-white dark:bg-gray-800"

<!-- Text -->
class="text-slate-900 dark:text-slate-100"

<!-- Border -->
class="border-slate-200 dark:border-gray-700"

<!-- Gradient (stays same) -->
class="bg-gradient-to-r from-blue-600 to-purple-700"
```

## Animation Classes

```css
/* Fade In */
animate-fade-in

/* Slide Up */
animate-slide-up

/* Pulse */
animate-pulse

/* Bounce (gentle) */
animate-bounce-gentle
```

## Component Checklist

When creating new components, ensure:
- ✅ Uses primary gradient (blue-purple) for main actions
- ✅ Uses success gradient (teal-green) for secondary actions
- ✅ Follows 8px spacing system
- ✅ Uses 12px border radius for buttons
- ✅ Uses 16px border radius for cards
- ✅ Minimum 48px button height
- ✅ Consistent icon sizes (h-6 w-6 for small, h-8 w-8 for large)
- ✅ Proper hover states (scale or translate)
- ✅ Dark mode support
- ✅ Focus states for accessibility
- ✅ Smooth transitions (duration-300)

## Quick Copy-Paste Templates

### Full-Width Gradient Section
```html
<section class="bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 py-16">
  <div class="max-w-7xl mx-auto px-4 text-center text-white">
    <h2 class="text-4xl font-bold mb-4">Section Title</h2>
    <p class="text-lg mb-8">Description text</p>
    <button class="bg-white text-purple-700 px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-transform">
      Call to Action
    </button>
  </div>
</section>
```

### Feature Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
      <Icon class="h-6 w-6 text-white" />
    </div>
    <h3 class="text-xl font-bold text-slate-900 mb-2">Feature Title</h3>
    <p class="text-slate-600">Feature description</p>
  </div>
</div>
```

---

**Remember**: Consistency is key! Use these patterns throughout the app for a cohesive user experience.
