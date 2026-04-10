export const getTokenRequest = async (data) => {
    return await fetch('https://topus.com.co/ApiRest/request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data
    });
}