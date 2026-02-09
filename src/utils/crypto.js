export const encryptData = (data) => {
    try {
        const jsonString = JSON.stringify(data);
        const uriEncoded = unescape(encodeURIComponent(jsonString));
        return btoa(uriEncoded);
    } catch (e) {
        console.error("Encoding failed", e);
        return null;
    }
};
