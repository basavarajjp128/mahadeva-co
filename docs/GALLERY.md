# Gallery image replacement

The Gallery page contains exactly eight subject cards. Four show photographs supplied for this task; the other four remain labeled placeholders and are not sourced from stock or generated imagery.

Add the remaining owner-provided photographs to `public/images/gallery/` using these filenames, then set the matching `image` property in `src/data/gallery.ts` to the path shown:

| Gallery subject       | Filename                       | Data path                                      |
| --------------------- | ------------------------------ | ---------------------------------------------- |
| Copra drying          | `copra-drying.jpg`             | `/images/gallery/copra-drying.jpg`             |
| Copra in sacks        | `copra-sacks.jpg`              | `/images/gallery/copra-sacks.jpg`              |
| 25 kg copra packaging | `copra-25kg-packaging.jpg`     | `/images/gallery/copra-25kg-packaging.jpg`     |
| Wholesale dispatch    | `wholesale-copra-dispatch.jpg` | `/images/gallery/wholesale-copra-dispatch.jpg` |

For each new photograph, update its `alt`, `description`, and `image` fields in the typed gallery data. Keep captions factual and limited to what the image shows. Add the supplied filename, creator/source, and usage rights to [IMAGE-CREDITS.md](IMAGE-CREDITS.md). The four existing supplied images are copied without alteration and retain their original file formats.
