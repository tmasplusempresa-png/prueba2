export const generateUID = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '-'; // El UID empieza con un guion
    for (let i = 0; i < 20; i++) {
      uid += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return uid;
  };