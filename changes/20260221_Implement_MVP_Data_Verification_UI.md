# 2026-02-21 Implement MVP Data Verification UI

## Date
2026-02-21

## User Request
The user requested a way to verify that the generated backend source actually delivers data to the frontend, given that the generated Figma UI does not automatically bind to the backend data models. The agreed-upon MVP approach is to render a raw data table at the bottom of the screen.

## Proposed Changes
1.  Modify `packages/frontend-gen/src/generator.ts` to inject a `<div id="data-verification-container"></div>` into the generated HTML.
2.  Add CSS styling for `#data-verification-container` to separate it from the Figma design preview.
3.  Update the `generateJS` method in `generator.ts` to output a `renderDataTable(modelName, data)` function.
4.  Modify `fetchData` to call `renderDataTable` upon a successful API response or when falling back to mock data.
5.  Modify `saveData` to automatically re-invoke `fetchData` after a successful POST request to update the data table.

## Reasoning
To prove end-to-end integration (Frontend -> Backend -> DB) without over-engineering complex dynamic data binding across arbitrarily positioned Figma elements.

## Impact Analysis
The generated preview HTML and JavaScript will include additional debugging code specific to verifying API connectivity. This will not impact the accuracy of the Figma-to-HTML element extraction but will augment the generated frontend with a demonstrative capability.

## Verification Steps
1. Run `./run-all.sh`.
2. Open the generated `index.html` or `myservice-main-dealer.html` in a browser.
3. Verify that an empty or populated data table appears at the bottom.
4. Click a "Save" button (if available) or trigger an API call to verify the table populates contextually.

## Status
Verified
