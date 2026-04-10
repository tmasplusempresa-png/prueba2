export const getUserData = async (data) => {
    return await fetch('https://topus.com.co/ApiRest/stateRequest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data
    });
}