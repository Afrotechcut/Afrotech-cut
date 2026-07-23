# Barber profile photos

Drop barber portrait photos in this folder (jpg/png/webp — any size, script will use as-is).

**Naming is optional but recommended for exact matching.** If a filename (minus extension) matches
one of the slugs below, that photo is assigned to that specific barber. Any files that don't match
a slug are assigned round-robin to whichever barbers don't have a photo yet — so you can just dump
20-ish generic barber portrait photos in here with no renaming and it'll still work.

| Filename to use | Barber |
|---|---|
| hildawells.jpg | Hilda Wells |
| sharpkutz.jpg | Sharp Kutz |
| thefadelab.jpg | The Fade Lab |
| royalclippers.jpg | Royal Clippers |
| kingscrownsbarbers.jpg | Kings & Crowns Barbers |
| blessedhandsbarbershop.jpg | Blessed Hands Barbershop |
| distinctionbarbers.jpg | Distinction Barbers |
| thegentlemenscut.jpg | The Gentlemen's Cut |
| crownglory.jpg | Crown & Glory |
| freshfadez.jpg | Fresh Fadez |
| sculptedbarbershop.jpg | Sculpted Barbershop |
| legacycuts.jpg | Legacy Cuts |
| thegroomingroom.jpg | The Grooming Room |
| prestigebarbers.jpg | Prestige Barbers |
| eliteedgebarbers.jpg | Elite Edge Barbers |
| nuvibebarbershop.jpg | Nu Vibe Barbershop |
| thebarberbench.jpg | The Barber Bench |
| immaculatecuts.jpg | Immaculate Cuts |
| sleekstylesbarbershop.jpg | Sleek Styles Barbershop |
| theclipperhouse.jpg | The Clipper House |
| finessebarbers.jpg | Finesse Barbers |
| toptiercuts.jpg | Top Tier Cuts |
| thesharpshop.jpg | The Sharp Shop |

Once photos are in place, run from the project root:

```
node scripts/upload-images.js
```
