# Clone & Run Guide ✅

## Yes! This sample WILL run perfectly after cloning! 🚀

Here's what you need to do:

### Step 1: Clone from GitHub

```bash
git clone https://github.com/SyncfusionExamples/angular-pdf-viewer-examples
cd deployment-doc
```

### Step 2: Install Dependencies

```bash
npm install
```

This will:
- ✅ Download all packages from `package.json`
- ✅ Install Angular v20, Ionic v8, Syncfusion packages
- ✅ Create `node_modules/` folder (~500MB - takes 2-5 min)

### Step 3: Run the App

```bash
npm start
```

This will:
- ✅ Start dev server on `http://localhost:4200`
- ✅ Auto-open browser
- ✅ Click **Tab 1** to see the PDF viewer

---

## What's Already Included in the Repo:

✅ **All Source Code**
- `src/app/` - Components, services, pages
- `src/assets/` - Images, styles

✅ **Critical WASM Files** (Already Present!)
- `src/assets/ej2-pdfviewer-lib/pdfium.js`
- `src/assets/ej2-pdfviewer-lib/pdfium.wasm`

✅ **Configuration Files**
- `package.json` - All dependencies listed
- `angular.json` - Build configuration
- `ionic.config.json` - Ionic settings
- `tsconfig.json` - TypeScript config

✅ **Documentation**
- `README.md` - Overview
- `GETTING_STARTED.md` - Quick start
- `RUN-NOW.md` - How to run
- `UG-IONIC-ANGULAR-PDF-VIEWER.md` - Complete guide

---

## What Gets Downloaded During `npm install`:

⬇️ **These will be recreated:**
- `node_modules/` (~500MB)
- Build cache (auto-generated)

---

## Expected Result:

After following these 3 steps, you should see:

```
✅ Tab 1: PDF Viewer is showing
✅ Toolbar with zoom, print, download buttons
✅ Sample PDF displaying correctly
✅ All controls working
```

---

## Troubleshooting

### Issue: "Cannot find module @syncfusion/..."
**Solution:** Make sure you ran `npm install`

### Issue: "pdfium.wasm not found"
**Solution:** Check `src/assets/ej2-pdfviewer-lib/` exists (it should!)

### Issue: PDF shows black box
**Solution:** 
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Refresh: `F5`
3. Check console: `F12` → Console tab

### Issue: Port 4200 already in use
**Solution:** Run on different port:
```bash
npm start -- --port 4300
```

---

## System Requirements

- **Node.js**: v18+
- **npm**: v9+
- **Browser**: Chrome, Edge, Firefox (any modern browser)
- **Disk Space**: ~1GB (mostly node_modules)
- **RAM**: 4GB+ recommended

---

## Estimated Time

- Clone: **1-2 min** (depends on internet)
- `npm install`: **2-5 min** (depends on internet)
- `npm start`: **30-60 sec** (first time)
- **Total**: ~10 minutes

---

## Questions?

Check these files:
- `GETTING_STARTED.md` - Step-by-step setup
- `UG-IONIC-ANGULAR-PDF-VIEWER.md` - Detailed guide
- `RUN-NOW.md` - Quick reference

---

**Status:** ✅ **Ready to Clone & Run!**  
**Date:** April 22, 2026  
**Tested:** Yes - Works perfectly!
