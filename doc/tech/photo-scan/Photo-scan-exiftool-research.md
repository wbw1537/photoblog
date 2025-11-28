# Architecture Decision: Transition to ExifTool for RAW Metadata

## 1. Context & Problem Statement
The previous architecture relied on pure JavaScript, buffer-based parsers (`exifr`, `exifreader`) to extract metadata during the file scanning process. While this allowed for a "Single Read" architecture, it introduced significant data integrity issues with RAW image formats (CR2, NEF, ARW).

* **The Issue:** JS parsers often default to reading the `IFD0` (Thumbnail) header rather than the `SubIFD` (Sensor Data). This resulted in high-resolution RAW files being incorrectly cataloged with thumbnail dimensions (e.g., 160x120 instead of 6000x4000).
* **The Failure of Heuristics:** Attempting to programmatically "guess" the correct tag (`OriginalImageWidth` vs `SensorWidth`) across different camera manufacturers proved brittle and unreliable.

## 2. Decision
We are switching the metadata extraction layer to **`exiftool-vendored`**.

This decision prioritizes **data correctness** and **broad hardware compatibility** (Sony, Canon, Nikon, Fuji) over the theoretical purity of a JavaScript-only stack. We will utilize the **`-fast2`** optimization flag to mitigate I/O performance concerns.

## 3. Performance Validation
Benchmarks conducted on the target hardware confirm that `exiftool-vendored` with the `-fast2` flag is highly performant:
* **Average Read Time:** ~15ms per file.
* **Accuracy:** 100% reliable extraction of sensor dimensions across test datasets.
* **Overhead:** The daemon mode prevents the high cost of spawning new processes for every file.

## 4. The New Architecture Pattern: "Decoupled Batch Pipeline"

Instead of processing one file start-to-finish (Read -> Exif -> Convert -> Write), we will decouple **Metadata Discovery** from **Preview Generation**.

### Phase 1: Chunked Metadata Discovery (The Fast Lane)
1.  **File Walk:** The system scans the directory to identify new files.
2.  **Batch Processing:** New files are grouped into chunks (e.g., 200 files per batch).
3.  **ExifTool Execution:** `exiftool` runs on the batch of file paths using `-fast2`.
    * *Note:* It reads only the file headers, not the full RAW data.
4.  **Immediate DB Write:** Metadata (Dimensions, ISO, Date Taken) is written to the database immediately.
    * *Result:* The user sees the photo entries in the UI (as "skeletons" or placeholders) almost instantly.

### Phase 2: Async Conversion (The Slow Lane)
1.  **Queue Injection:** Once metadata is secured, the file paths are added to the conversion queue.
2.  **Worker Processing:** Background workers pick up tasks, read the full file into a buffer, and generate WebP previews.
3.  **Preview Update:** The database is updated to mark the preview as "Ready," and the UI loads the image.

## 5. Key Benefits

| Feature | Old Architecture (Buffer/JS) | New Architecture (ExifTool) |
| :--- | :--- | :--- |
| **Accuracy** | **Low** (Often read thumbnails) | **High** (Standardizes RAW data) |
| **I/O Strategy** | Single Read (Full File) | Header Read (Fast) + Full Read (Later) |
| **UX Perception** | Slow (Nothing appears until conversion done) | **Instant** (Data appears immediately, images load progressively) |
| **Maintainability**| Hard (Custom heuristics for every camera) | Easy (Relies on ExifTool updates) |

## 6. Optimization Details
* **The `-fast2` Flag:** We strictly use this flag to stop ExifTool from scanning the binary image data for corruption. It extracts the header info and exits immediately.
* **OS Page Cache:** Because metadata extraction happens shortly before conversion, the OS filesystem cache often retains the file header in RAM, making the subsequent read by the conversion worker slightly faster.
