// Konjac (ဝဥ) photo set — uploaded by the cooperative.
// Each entry is grouped by where in the supply chain it sits, so we can reuse the
// same set on the landing page, /processing, and any future crop detail view.
import field from "@/assets/konjac/image-3.jpg.asset.json";
import tubersStockpile from "@/assets/konjac/image-4.jpg.asset.json";
import washingLine from "@/assets/konjac/image-7.jpg.asset.json";
import tipper from "@/assets/konjac/image-10.jpg.asset.json";
import slicedDrying from "@/assets/konjac/image-6.jpg.asset.json";
import slicedAndTubers from "@/assets/konjac/image-8.jpg.asset.json";
import dryingRacks from "@/assets/konjac/image-9.jpg.asset.json";
import sortingLine from "@/assets/konjac/image-2.jpg.asset.json";
import processingHall from "@/assets/konjac/image.jpg.asset.json";
import warehouse from "@/assets/konjac/image-5.jpg.asset.json";

export type KonjacPhoto = {
  url: string;
  stage: "field" | "harvest" | "processing" | "drying" | "warehouse";
  caption_en: string;
  caption_my: string;
};

export const konjacPhotos: KonjacPhoto[] = [
  {
    url: field.url,
    stage: "field",
    caption_en: "Young konjac plants on terraced upland",
    caption_my: "တောင်ပေါ်လယ်ယာတွင် ဝဥပင်ငယ်များ",
  },
  {
    url: tubersStockpile.url,
    stage: "harvest",
    caption_en: "Fresh tubers stacked after lift",
    caption_my: "ထုတ်ပြီးစ ဝဥအဥများ စုပုံထား",
  },
  {
    url: tipper.url,
    stage: "processing",
    caption_en: "Intake hopper feeding the wash line",
    caption_my: "ဆေးကြောလိုင်းသို့ ထည့်သွင်းနေ",
  },
  {
    url: washingLine.url,
    stage: "processing",
    caption_en: "Sorting and washing under cover",
    caption_my: "အမိုးအောက်တွင် ခွဲခြားဆေးကြောခြင်း",
  },
  {
    url: processingHall.url,
    stage: "processing",
    caption_en: "Stainless processing hall",
    caption_my: "သံမဏိ စီမံခန့်ခွဲခန်း",
  },
  {
    url: sortingLine.url,
    stage: "processing",
    caption_en: "Grading conveyor",
    caption_my: "အရွယ်အစား ခွဲခြားလိုင်း",
  },
  {
    url: slicedDrying.url,
    stage: "drying",
    caption_en: "Sliced konjac drying on bamboo mats",
    caption_my: "ဝါးဖျာပေါ်တွင် လှီးထားသော ဝဥများ အခြောက်ခံ",
  },
  {
    url: slicedAndTubers.url,
    stage: "drying",
    caption_en: "Whole tubers and sun-dried slices",
    caption_my: "ဝဥအဥများနှင့် နေလှန်းခြောက်ပြားများ",
  },
  {
    url: dryingRacks.url,
    stage: "drying",
    caption_en: "Stacked drying racks",
    caption_my: "ထပ်ထားသော အခြောက်ခံပင်းများ",
  },
  {
    url: warehouse.url,
    stage: "warehouse",
    caption_en: "Bagged dried konjac in the warehouse",
    caption_my: "ဂိုဒေါင်တွင် ထုပ်ပိုးပြီး ဝဥခြောက်အိတ်များ",
  },
];

export const konjacHero = processingHall.url;
export const konjacFieldHero = field.url;
