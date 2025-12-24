// themeUtils.js
export const getThemeColors = () => {
    try {
      // Пробуем получить из localStorage
      const savedTheme = localStorage.getItem('telegramTheme');
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
        return parsed;
      }
      
      // Пробуем получить из CSS переменных
      const root = document.documentElement;
      const bgColor = getComputedStyle(root).getPropertyValue('--tg-bg-color').trim() || '#ffffff';
      const textColor = getComputedStyle(root).getPropertyValue('--tg-text-color').trim() || '#000000';
      const hintColor = getComputedStyle(root).getPropertyValue('--tg-hint-color').trim() || '#8e8e93';
      const buttonColor = getComputedStyle(root).getPropertyValue('--tg-button-color').trim() || '#3390ec';
      const buttonTextColor = getComputedStyle(root).getPropertyValue('--tg-button-text-color').trim() || '#ffffff';
      const secondaryBgColor = getComputedStyle(root).getPropertyValue('--tg-secondary-bg-color').trim() || '#f1f1f1';
      const sectionBgColor = getComputedStyle(root).getPropertyValue('--tg-section-bg-color').trim() || '#e7e8ec';
      
      return {
        bg_color: bgColor,
        text_color: textColor,
        hint_color: hintColor,
        button_color: buttonColor,
        button_text_color: buttonTextColor,
        secondary_bg_color: secondaryBgColor,
        section_bg_color: sectionBgColor
      };
    } catch (error) {
      console.error('❌ Ошибка получения темы:', error);
      
      // Дефолтные цвета
      return {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#8e8e93',
        button_color: '#3390ec',
        button_text_color: '#ffffff',
        secondary_bg_color: '#f1f1f1',
        section_bg_color: '#e7e8ec'
      };
    }
  };