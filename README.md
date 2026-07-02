# RHISK - ASCCP 2019 Guidelines

A simple, mobile-first web application for cervical cancer screening risk assessment based on the ASCCP 2019 Risk-Based Management Consensus Guidelines.

## 🌐 Live App
**https://robbie-med.github.io/rhisk**

## 📱 Features

- **Risk Assessment**: Calculate CIN3+ risk based on cytology, HPV status, and patient history
- **Evidence-Based Recommendations**: Management guidance following ASCCP 2019 guidelines
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Dark Mode**: Toggle between light and dark themes
- **Export Results**: Download assessment as JSON file
- **Privacy-First**: All calculations done locally in browser

## 🚀 Quick Start

This is a simple static website - just download the files and open `index.html` in any browser!

### Option 1: Direct Use
1. Download the files: `index.html`, `styles.css`, and `favicon.svg`
2. Open `index.html` in your web browser
3. Start using the risk assessment tool

### Option 2: GitHub Pages Hosting
1. Upload files to your GitHub repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → `main` branch
4. Your app will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO`

## 📋 Clinical Workflow

1. **Step 1**: Enter patient demographics and current test results
2. **Step 2**: Add previous screening history (optional)
3. **Step 3**: Include treatment history and additional factors (optional)  
4. **Step 4**: View risk assessment and management recommendations

## 🎯 Risk Categories

- **High Risk (≥4%)**: Immediate colposcopy recommended
- **Intermediate Risk (1-4%)**: Enhanced surveillance in 12 months
- **Low Risk (<1%)**: Return to routine screening intervals

## 💻 Technical Details

- **Pure HTML/CSS/JavaScript** - No frameworks required
- **Responsive Design** - Works on all devices
- **Local Storage** - Remembers dark mode preference
- **No Server Required** - Runs entirely in browser
- **Export Functionality** - Save assessments as JSON

## ⚠️ Important Medical Disclaimer

**FOR EDUCATIONAL PURPOSES ONLY**

This tool provides guidance based on ASCCP 2019 guidelines but should not replace:
- Clinical judgment and experience
- Individual patient assessment
- Consultation with specialists when indicated
- Current medical literature and guidelines

Always consider:
- Patient preferences and circumstances
- Comorbidities and risk factors
- Local clinical protocols
- Specialist referral when appropriate

## 📚 Based on ASCCP 2019 Guidelines

This application implements risk-based management principles from:
- ASCCP 2019 Risk-Based Management Consensus Guidelines
- "Equal management for equal risk" principle
- Evidence-based risk thresholds for CIN3+ detection

## 🔧 Customization

The app can be easily customized by editing:
- `styles.css` - Modify colors, fonts, and layout
- `index.html` - Add new form fields or content
- Risk calculation logic in the JavaScript section

## 📄 File Structure

```
rhisk/
├── index.html     # Main application file
├── styles.css     # All styling and responsive design
├── favicon.svg    # App icon
└── README.md      # This documentation
```

## 🌟 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox  
- ✅ Safari
- ✅ Mobile browsers
- ✅ Internet Explorer 11+

## 📱 Mobile Features

- Touch-friendly interface
- Optimized for small screens
- Fast loading on mobile networks
- Offline capability after first load
- Native share functionality on supported devices

## 🔒 Privacy & Security

- **No data transmission** - Everything processed locally
- **No cookies or tracking** - Privacy-first design
- **HTTPS ready** - Secure when hosted properly
- **No login required** - Immediate access to tool

## 🚑 Clinical Use Guidelines

### Recommended For:
- Educational purposes and training
- Quick risk calculations during consultations
- Patient education and shared decision-making
- Clinical workflow optimization

### Not Recommended For:
- Primary clinical decision-making without physician oversight
- Replacement of clinical guidelines or protocols
- Use without appropriate medical training
- Complex cases requiring specialist input

## 📊 Risk Calculation

The app uses evidence-based algorithms considering:
- Current cytology results (NILM, ASC-US, ASC-H, LSIL, HSIL, AGC, AIS)
- HPV test results with genotyping (16, 18, other HR-HPV)
- Patient age and risk modifiers
- Previous screening history
- Biopsy results and treatment history
- Special circumstances (pregnancy, immunocompromised status)

## 🔄 Updates and Maintenance

This tool should be updated when:
- New ASCCP guidelines are published
- Risk calculation algorithms are revised
- New evidence becomes available
- Clinical practice standards change

## 📞 Support

For technical issues:
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page
- Use a modern browser

For clinical questions:
- Consult current ASCCP guidelines
- Refer to peer-reviewed literature
- Consider specialist consultation
- Contact your institution's guidelines committee

---

**Version**: 1.0.0  
**Last Updated**: June 2025  
**Guidelines**: ASCCP 2019 Risk-Based Management Consensus  
**License**: Educational Use
