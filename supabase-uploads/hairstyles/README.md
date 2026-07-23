# Hairstyle catalogue photos

These power the AI Style Match results and the hairstyle catalogue. **Filenames must match the
slug exactly** (extension can be jpg/png/webp) so each photo lands on the correct style.

| Filename to use | Style |
|---|---|
| high-top-fade.jpg | High Top Fade |
| low-skin-fade.jpg | Low Skin Fade |
| mid-fade-waves.jpg | Mid Fade with 360 Waves |
| full-afro.jpg | Full Afro |
| twist-out.jpg | Twist Out |
| mohawk-fade.jpg | Mohawk Fade |
| starter-locs.jpg | Starter Locs |
| caesar-taper.jpg | Caesar with Taper |
| line-up.jpg | Line Up / Edge Up |
| burst-fade.jpg | Burst Fade |
| taper-fade.jpg | Taper Fade |
| temple-fade.jpg | Temple Fade |
| freeform-locs.jpg | Freeform Locs |
| cornrows-straight-back.jpg | Cornrows (Straight Back) |
| drop-fade-curl-top.jpg | Drop Fade with Curl Top |

Don't have all 15? No problem — any slugs without a matching file just keep showing their current
fallback image, nothing breaks.

Once photos are in place, run from the project root:

```
node scripts/upload-images.js
```
