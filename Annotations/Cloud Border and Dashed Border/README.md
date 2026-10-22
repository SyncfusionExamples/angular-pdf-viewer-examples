# Cloud Border and Dashed Border Annotations in Angular PDF Viewer

This sample demonstrates **Cloud** and **Dashed** border support for shape, measurement, and Free Text annotations in the Syncfusion Angular PDF Viewer.

## What is covered

### 1. Set the annotation mode for newly added annotations

Use `annotation.setAnnotationMode(...)` to activate a drawing mode. The sample provides buttons for
`Rectangle`, `Circle`, `Polygon`, `FreeText`, `Area`, and `Line`. Once a mode is active,
drag on the page to place the annotation and the configured border style is applied to it.

### 2. Exit the annotation mode

Use `annotation.setAnnotationMode('None')` to leave the current drawing mode.

### 3. Add annotations programmatically

Use `annotation.addAnnotation(<type>, { ... })` with `borderStyle`, and the optional
`cloudIntensity` (1–2, default 1) and `borderDashArray` dash-pattern settings.

### 4. Modify an existing annotation

Select an annotation and use `annotation.editAnnotation(annotation, { borderStyle })` to switch
its border between Solid, Cloud, and Dashed.

## Border style support matrix

| Annotation type | Solid | Cloud | Dashed | Settings property |
| --- | --- | --- | --- | --- |
| Rectangle | ✓ | ✓ | ✓ | `rectangleSettings` |
| Circle | ✓ | ✓ | ✓ | `circleSettings` |
| Polygon | ✓ | ✓ | ✓ | `polygonSettings` |
| Cloud | ✓ | ✓ | — | `cloudSettings` |
| Free Text | ✓ | ✓ | ✓ | `freeTextSettings` |
| Area | ✓ | ✓ | ✓ | `areaSettings` |
| Radius | ✓ | ✓ | ✓ | `radiusSettings` |
| Volume | ✓ | ✓ | ✓ | `volumeSettings` |
| Perimeter | ✓ | — | ✓ | `perimeterSettings` |
| Distance | ✓ | — | ✓ | `distanceSettings` |
| Line | ✓ | — | ✓ | `lineSettings` |
| Arrow | ✓ | — | ✓ | `arrowSettings` |

## BorderStyle enum

```ts
BorderStyle.Solid  // 'Solid'
BorderStyle.Dashed // 'Dashed'
BorderStyle.Cloud  // 'Cloud'
```

`borderStyle`, `borderDashArray`, and `cloudIntensity` are preserved during save, reload, import,
and export.

## Run the sample

```bash
cd syncfusion-angular-app
npm install
npm start
```

The sample loads a blank PDF (`/blank.pdf`) so you can freely place and experiment with the
different border styles.

## Asset note

Place a `blank.pdf` in the `public/` folder (the sample ships with one) so the PDF Viewer can load
it from `window.location.origin + '/blank.pdf'`.
