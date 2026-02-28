export type VrExample = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  palette: string;
  videoUrl: string;
};

export const vrExamples: VrExample[] = [
  {
    id: 'heights',
    titleAr: 'رهاب المرتفعات',
    titleEn: 'Fear of Heights',
    descriptionAr: 'تعرض تدريجي لارتفاعات افتراضية ضمن جلسة آمنة لتقليل الاستجابة القلقة.',
    descriptionEn: 'Gradual exposure to virtual heights in a safe session to reduce anxiety response.',
    palette: 'from-cyan-50 via-white to-teal-100/70',
    videoUrl: 'https://www.youtube.com/embed/9MHJlwLWXt4'
  },
  {
    id: 'spiders',
    titleAr: 'رهاب العناكب',
    titleEn: 'Fear of Spiders',
    descriptionAr: 'محاكاة مرئية متدرجة تساعد على إعادة تنظيم الاستجابة للخوف مع متابعة المعالج.',
    descriptionEn: 'Progressive visual simulation to retrain fear response with therapist guidance.',
    palette: 'from-sky-50 via-white to-emerald-100/60',
    videoUrl: 'https://www.youtube.com/embed/7sMYvqweIPc'
  },
  {
    id: 'flying',
    titleAr: 'رهاب الطيران',
    titleEn: 'Fear of Flying',
    descriptionAr: 'بيئات سفر افتراضية واقعية للتأقلم مع مراحل الرحلة وتقليل التوتر قبل الطيران.',
    descriptionEn: 'Realistic virtual travel scenes to adapt to flight stages and reduce pre-flight stress.',
    palette: 'from-cyan-50 via-white to-blue-100/70',
    videoUrl: 'https://www.youtube.com/embed/NkNA1mKpL0w'
  },
  {
    id: 'social',
    titleAr: 'القلق الاجتماعي',
    titleEn: 'Social Anxiety',
    descriptionAr: 'تمارين تفاعل اجتماعي افتراضي لبناء الثقة وتحسين تنظيم القلق في المواقف اليومية.',
    descriptionEn: 'Virtual social interaction exercises to build confidence and regulate anxiety.',
    palette: 'from-teal-50 via-white to-cyan-100/70',
    videoUrl: 'https://www.youtube.com/embed/OoU9Yb0sHJ0'
  }
];
