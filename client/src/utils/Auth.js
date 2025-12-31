export const STORAGE_KEY = "maallem_user";

export const getUser = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const user = raw ? JSON.parse(raw) : null;


        if (!user?.id || !user?.role) return null;

        return user;
    } catch {
        return null;
    }
};

export const setUser = (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearUser = () => {
    localStorage.removeItem(STORAGE_KEY);
};
