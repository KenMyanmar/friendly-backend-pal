import avocadoOrchard from "@/assets/gallery/avocado-orchard.png.asset.json";
import communityMeeting from "@/assets/gallery/community-meeting.png.asset.json";
import garlicHarvest from "@/assets/gallery/garlic-harvest.png.asset.json";
import konjacDryingHouse from "@/assets/gallery/konjac-drying-house.png.asset.json";
import konjacFlower from "@/assets/gallery/konjac-flower.png.asset.json";
import konjacSortingFarmers from "@/assets/gallery/konjac-sorting-farmers.png.asset.json";
import konjacSproutingSeed from "@/assets/gallery/konjac-sprouting-seed.png.asset.json";
import mangoHarvest from "@/assets/gallery/mango-harvest.png.asset.json";
import strawberryCrates from "@/assets/gallery/strawberry-crates.png.asset.json";
import strawberryField from "@/assets/gallery/strawberry-field.png.asset.json";

export type ShowcasePhoto = {
  url: string;
  title_en: string;
  title_my: string;
  alt_en: string;
  alt_my: string;
};

export const cropShowcasePhotos: ShowcasePhoto[] = [
  {
    url: avocadoOrchard.url,
    title_en: "Avocado orchard",
    title_my: "ထောပတ်သီးခြံ",
    alt_en: "Avocados hanging in a Special Zone 6 orchard",
    alt_my: "အထူးဒေသ (၆) ရှိ ထောပတ်သီးခြံတွင် သီးပင်များ",
  },
  {
    url: strawberryField.url,
    title_en: "Strawberry field",
    title_my: "စတော်ဘယ်ရီခင်း",
    alt_en: "Young strawberry plants growing in neat rows",
    alt_my: "တန်းစီစိုက်ထားသော စတော်ဘယ်ရီပင်ငယ်များ",
  },
  {
    url: strawberryCrates.url,
    title_en: "Packed strawberries",
    title_my: "ထုပ်ပိုးထားသော စတော်ဘယ်ရီ",
    alt_en: "Fresh strawberries packed in crates for market",
    alt_my: "ဈေးကွက်တင်ရန် သေတ္တာထဲထုပ်ပိုးထားသော စတော်ဘယ်ရီသီးများ",
  },
  {
    url: mangoHarvest.url,
    title_en: "Mango harvest",
    title_my: "သရက်သီးထွက်ကုန်",
    alt_en: "Ripe yellow mangoes ready for sale",
    alt_my: "ရောင်းချရန်အဆင်သင့်ဖြစ်သော သရက်သီးဝါဝါများ",
  },
  {
    url: garlicHarvest.url,
    title_en: "Garlic harvest",
    title_my: "ကြက်သွန်ဖြူရိတ်သိမ်းမှု",
    alt_en: "Freshly harvested garlic laid out in rows on a field",
    alt_my: "လယ်မြေပေါ်တွင် တန်းစီခင်းထားသော အသစ်ရိတ်သိမ်းထားသည့် ကြက်သွန်ဖြူများ",
  },
];

export type KonjacGalleryPhoto = {
  url: string;
  stage: "field" | "harvest" | "processing" | "drying" | "warehouse";
  caption_en: string;
  caption_my: string;
};

export const extraKonjacPhotos: KonjacGalleryPhoto[] = [
  {
    url: konjacSproutingSeed.url,
    stage: "field",
    caption_en: "Sprouting konjac seed tubers prepared for planting",
    caption_my: "စိုက်ပျိုးရန် ပြင်ဆင်ထားသော အပင်ပေါက်နေသည့် ဝဥမျိုးအုပ်များ",
  },
  {
    url: konjacFlower.url,
    stage: "field",
    caption_en: "A konjac flower emerging in the field",
    caption_my: "စိုက်ခင်းအတွင်း ထွက်ပေါ်လာသည့် ဝဥပန်း",
  },
  {
    url: konjacSortingFarmers.url,
    stage: "harvest",
    caption_en: "Farmers sorting freshly lifted konjac tubers",
    caption_my: "အသစ်တူးထုတ်ထားသည့် ဝဥအဥများကို တောင်သူများ ခွဲခြားရွေးခြယ်နေမှု",
  },
  {
    url: konjacDryingHouse.url,
    stage: "drying",
    caption_en: "Covered drying house for sliced konjac",
    caption_my: "ဝဥလှီးပြားများအတွက် အမိုးပါ အခြောက်ခံအိမ်",
  },
];

export const communityFeature = {
  url: communityMeeting.url,
  alt_en: "Community meeting with farmers and cooperative members",
  alt_my: "တောင်သူများနှင့် ပူးပေါင်းအဖွဲ့ဝင်များ၏ အစည်းအဝေး",
};
