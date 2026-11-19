// Review copy for the local experience. Each entry corresponds to one camera stop.
export const copy = {
  en: {
    title: 'APĀR: Beyond the Ordinary', by: 'a film in six movements', studio: 'APĀR · Agentive Creacy',
    enter: 'Enter the studio', contact: 'Contact', email: 'Email', work: 'Selected work', city: 'Mumbai',
    next: 'Next scene', galaxy: 'Continue to the APĀR galaxy', sound: 'Ambient sound', chapters: 'Scenes', close: 'Close', send: 'Write to APĀR',
    names: ['Opening', 'Studio', 'Practice', 'Process', 'Manifesto', 'Clients', 'Contact'],
    lines: [
      [],
      ['APĀR is a creative studio in Mumbai.', 'We build identities, campaigns and digital experiences for brands with a point of view.'],
      ['A name. A mark. A world around it.', 'Our practice moves between brand strategy, art direction and digital design. The work can take many forms. The idea holds them together.'],
      ['Every project starts with a question.', 'We look at what makes a brand distinct, then give that idea a shape, a voice and a place to live.'],
      ['Brands worth remembering.', 'The image moves. The frame changes. What stays with you is the idea.'],
      ['Our collaborators.', 'Jewellery houses, independent labels and people building something of their own.'],
      ['What are you working on?', 'Tell us about the idea you keep coming back to. We’d love to hear it.'],
    ],
  },
  hi: {
    title: 'अपार: साधारण से परे', by: 'छह दृश्यों में एक कहानी', studio: 'अपार · एजेंटिव क्रीएसी',
    enter: 'स्टूडियो में प्रवेश', contact: 'संपर्क', email: 'ईमेल', work: 'चुनिंदा काम', city: 'मुंबई',
    next: 'अगला दृश्य', galaxy: 'अपार की आकाशगंगा देखें', sound: 'पृष्ठभूमि ध्वनि', chapters: 'दृश्य', close: 'बंद करें', send: 'अपार को लिखें',
    names: ['शुरुआत', 'स्टूडियो', 'हमारा काम', 'प्रक्रिया', 'हमारी सोच', 'सहयोगी', 'संपर्क'],
    lines: [
      [],
      ['अपार मुंबई का एक क्रिएटिव स्टूडियो है।', 'हम ब्रांडों के लिए पहचान, अभियान और डिजिटल अनुभव बनाते हैं।'],
      ['एक नाम। एक निशान। उसके इर्द-गिर्द एक दुनिया।', 'हमारी दुनिया में ब्रांड रणनीति, कला निर्देशन और डिजिटल डिज़ाइन एक साथ आते हैं। काम का रूप बदलता है, विचार उसे जोड़े रखता है।'],
      ['हर प्रोजेक्ट एक सवाल से शुरू होता है।', 'हम खोजते हैं कि किसी ब्रांड की पहचान क्या है। फिर उस विचार को एक रूप, एक आवाज़ और एक जगह देते हैं।'],
      ['ऐसे ब्रांड जो याद रह जाएँ।', 'तस्वीर बदलती है। फ़्रेम बदलता है। जो आपके साथ रहता है, वह है विचार।'],
      ['हमारे सहयोगी।', 'आभूषण घराने, स्वतंत्र लेबल और अपनी अलग पहचान बनाने वाले लोग।'],
      ['आप किस पर काम कर रहे हैं?', 'उस विचार के बारे में बताइए जो बार-बार आपके मन में आता है। हम उसे सुनना चाहेंगे।'],
    ],
  },
};
export type Language = keyof typeof copy;

export const clients = [
  ['Chheda Jewellers', 'chheda'], ['Girvaan', 'girvaan'], ['Maison Mireyaa', 'maison-mireyaa'],
  ['High on Smiles', 'high-on-smiles'], ['Silver Emporium', 'silver-emporium'], ['Tarava', 'tarava'],
  ['Kundan Jewellers', 'kundan-jewellers'], ['Achal', 'achal'],
] as const;
