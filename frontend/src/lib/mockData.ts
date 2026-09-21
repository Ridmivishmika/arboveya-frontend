import { Product, WellnessNeed, ProductTypeItem, SiteSettings } from '@/types';

export const fallbackSettings: SiteSettings = {
  id: 1,
  homePageHeroText: "Nature's Healing, Perfected",
  aboutUsContent: "Premium herbal wellness products crafted from nature's finest ingredients to support a healthier and balanced lifestyle.",
  facebookLink: "https://facebook.com/arboveya",
  whatsAppNumber: "+94 77 123 4567"
};

export const wellnessNeeds: WellnessNeed[] = [
  {
    id: '1',
    title: 'Respiratory Health',
    subtitle: 'Asthma, Cough, Lung Support',
    icon: 'lungs',
    slug: 'respiratory-health'
  },
  {
    id: '2',
    title: 'Stress & Relaxation',
    subtitle: 'Stress Relief, Better Sleep',
    icon: 'brain',
    slug: 'stress-relaxation'
  },
  {
    id: '3',
    title: 'Kidney Support',
    subtitle: 'Kidney Cleanse, Detox Support',
    icon: 'kidney',
    slug: 'kidney-support'
  },
  {
    id: '4',
    title: 'Blood Sugar Support',
    subtitle: 'Healthy Blood Sugar Levels',
    icon: 'droplet',
    slug: 'blood-sugar-support'
  },
  {
    id: '5',
    title: 'Immune Support',
    subtitle: 'Boost Immunity, Stay Strong',
    icon: 'shield-plus',
    slug: 'immune-support'
  },
  {
    id: '6',
    title: 'Digestive Health',
    subtitle: 'Gut Health, Better Digestion',
    icon: 'stomach',
    slug: 'digestive-health'
  },
  {
    id: '7',
    title: 'Liver Detox',
    subtitle: 'Liver Cleanse, Detox Support',
    icon: 'liver',
    slug: 'liver-detox'
  },
  {
    id: '8',
    title: 'Weight Management',
    subtitle: 'Weight Loss, Metabolism Boost',
    icon: 'activity',
    slug: 'weight-management'
  },
  {
    id: '9',
    title: "Women's Wellness",
    subtitle: 'Hormonal Balance, Women\'s Health',
    icon: 'flower',
    slug: 'womens-wellness'
  },
  {
    id: '10',
    title: "Men's Wellness",
    subtitle: 'Men\'s Health, Vitality Support',
    icon: 'sparkles',
    slug: 'mens-wellness'
  },
  {
    id: '11',
    title: 'Joint & Bone Care',
    subtitle: 'Arthritis, Bone Strong',
    icon: 'bone',
    slug: 'joint-bone-care'
  }
];

export const getProductWellnessNeed = (product: Product): string => {
  if (product.wellnessNeed) return product.wellnessNeed;
  
  if (product.keyBenefits) {
    const match = product.keyBenefits.match(/Wellness Need:\s*([^\n\r]+)/i);
    if (match && match[1]) return match[1].trim();
  }

  const text = `${product.name} ${product.description || ''} ${product.keyBenefits || ''} ${product.ingredients || ''} ${product.categoryName || ''}`.toLowerCase();
  
  if (text.includes('cinnamon') || text.includes('sugar') || text.includes('glucose') || text.includes('diabetes') || text.includes('metabolic') || text.includes('himbutu')) {
    return 'Blood Sugar Support';
  }
  if (text.includes('ashwagandha') || text.includes('brahmi') || text.includes('gotu kola') || text.includes('stress') || text.includes('sleep') || text.includes('calm') || text.includes('relax') || text.includes('cognitive') || text.includes('memory') || text.includes('anxiety')) {
    return 'Stress & Relaxation';
  }
  if (text.includes('respiratory') || text.includes('lung') || text.includes('cough') || text.includes('asthma') || text.includes('vasa') || text.includes('licorice') || text.includes('bronchial')) {
    return 'Respiratory Health';
  }
  if (text.includes('turmeric') || text.includes('curcumin') || text.includes('joint') || text.includes('bone') || text.includes('arthritis') || text.includes('inflammation') || text.includes('cartilage')) {
    return 'Joint & Bone Care';
  }
  if (text.includes('kidney') || text.includes('polpala') || text.includes('neeramulliya') || text.includes('urinary') || text.includes('renal')) {
    return 'Kidney Support';
  }
  if (text.includes('liver') || text.includes('bovitiya') || text.includes('hepatic') || text.includes('bile')) {
    return 'Liver Detox';
  }
  if (text.includes('digest') || text.includes('gut') || text.includes('stomach') || text.includes('belimal') || text.includes('gastric') || text.includes('bowel') || text.includes('cleansing') || text.includes('detox')) {
    return 'Digestive Health';
  }
  if (text.includes('weight') || text.includes('metabolism') || text.includes('fat') || text.includes('slimming') || text.includes('garcinia')) {
    return 'Weight Management';
  }
  if (text.includes('hair') || text.includes('women') || text.includes('shatavari') || text.includes('hormon') || text.includes('skin') || text.includes('beauty')) {
    return "Women's Wellness";
  }
  if (text.includes('men') || text.includes('stamina') || text.includes('vitality') || text.includes('strength') || text.includes('kaunch')) {
    return "Men's Wellness";
  }
  if (text.includes('moringa') || text.includes('immune') || text.includes('immunity') || text.includes('defense') || text.includes('vitamin') || text.includes('antioxidant')) {
    return 'Immune Support';
  }

  return 'Immune Support';
};

export const bestSellerProducts: Product[] = [];

export const productTypes: ProductTypeItem[] = [
  { id: 't1', name: 'Capsules', icon: 'capsule', slug: 'capsules' },
  { id: 't2', name: 'Tea', icon: 'coffee', slug: 'tea' },
  { id: 't3', name: 'Powders', icon: 'mortar', slug: 'powders' },
  { id: 't4', name: 'Leaves', icon: 'leaf', slug: 'leaves' },
  { id: 't5', name: 'Oils', icon: 'dropper', slug: 'oils' },
  { id: 't6', name: 'Seeds', icon: 'seed', slug: 'seeds' },
  { id: 't7', name: 'Bundles', icon: 'gift', slug: 'bundles' },
];
