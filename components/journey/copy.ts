// Review copy for the local experience. Each entry corresponds to one camera stop.
export const copy = {
  en: {
    title: 'APĀR: Beyond the Ordinary', by: 'a film in six movements', studio: 'APĀR · Agentive Creacy',
    enter: 'Enter the studio', contact: 'Contact', email: 'Email', work: 'Selected work', city: 'Mumbai',
    next: 'Next scene', galaxy: 'Continue to the APĀR galaxy', sound: 'Ambient sound', chapters: 'Scenes', close: 'Close', send: 'Write to APĀR',
    names: ['Opening', 'Studio', 'Practice', 'Process', 'Manifesto', 'Clients', 'Contact'],
    lines: [
      [],
      ['A creative studio in Mumbai.', 'We’re APĀR. We work with founders to give a business its name, its voice and a look that feels like its own.'],
      ['From the box to the screen.', 'A mark on a jewellery box becomes the starting point for a photograph, a campaign or a digital experience.'],
      ['Which detail makes it yours?', 'We start there. We sketch, shoot and test until the detail that caught our eye comes through in the work.'],
      ['What stays after the image fades?', 'A colour, a silhouette, the way a name sounds. We design around the things people carry with them.'],
      ['The people behind the work.', 'Girvaan brings jewellery to the table. Maison Mireyaa brings flowers. Their materials shape the work.'],
      ['Tell us what you’re making.', 'Bring a first sketch, a collection ready to launch or a question you’re still working through.'],
    ],
  },
  hi: {
    title: 'अपार: साधारण से परे', by: 'छह दृश्यों में एक कहानी', studio: 'अपार · एजेंटिव क्रीएसी',
    enter: 'स्टूडियो में प्रवेश', contact: 'संपर्क', email: 'ईमेल', work: 'चुनिंदा काम', city: 'मुंबई',
    next: 'अगला दृश्य', galaxy: 'अपार की आकाशगंगा देखें', sound: 'पृष्ठभूमि ध्वनि', chapters: 'दृश्य', close: 'बंद करें', send: 'अपार को लिखें',
    names: ['शुरुआत', 'स्टूडियो', 'हमारा काम', 'प्रक्रिया', 'हमारी सोच', 'सहयोगी', 'संपर्क'],
    lines: [
      [],
      ['मुंबई का एक क्रिएटिव स्टूडियो।', 'हम अपार हैं। ब्रांड बनाने वालों के साथ मिलकर हम ऐसा नाम, ऐसी भाषा और ऐसा रूप तलाशते हैं जो उनका अपना लगे।'],
      ['डिब्बे से लेकर स्क्रीन तक।', 'गहनों के डिब्बे पर बना एक निशान किसी तस्वीर, अभियान या डिजिटल अनुभव की शुरुआत बन सकता है।'],
      ['किस बारीकी में आपकी पहचान है?', 'हम वहीं से शुरू करते हैं। स्केच बनाते हैं, तस्वीरें लेते हैं और उन्हें परखते हैं, जब तक वह बारीकी साफ़ नज़र न आए।'],
      ['तस्वीर ओझल हो जाए तो क्या याद रहता है?', 'कोई रंग, कोई आकृति, किसी नाम की लय। जो मन में ठहर जाए, हमारे डिज़ाइन का आधार वही है।'],
      ['हमारे काम के साथी।', 'गिरवाण के गहने, मेज़ों मिरेया के फूल। हर साझेदारी की अपनी पहचान है।'],
      ['आप क्या बना रहे हैं?', 'पहला स्केच हो, लॉन्च के लिए तैयार कोई कलेक्शन हो या मन में अटका कोई सवाल। हमें बताइए।'],
    ],
  },
};
export type Language = keyof typeof copy;

export const clients = [
  ['Chheda Jewellers', 'chheda'], ['Girvaan', 'girvaan'], ['Maison Mireyaa', 'maison-mireyaa'],
  ['High on Smiles', 'high-on-smiles'], ['Silver Emporium', 'silver-emporium'], ['Tarava', 'tarava'],
  ['Kundan Jewellers', 'kundan-jewellers'], ['Achal', 'achal'],
] as const;
