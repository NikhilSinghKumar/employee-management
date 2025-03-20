"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [firstName, setFirstName] = useState("");

    useEffect(() => {
        const storedName = localStorage.getItem("first_name");
        if (storedName) setFirstName(storedName);
    }, []);

    const updateFirstName = (name) => {
        setFirstName(name);
        localStorage.setItem("first_name", name);
    };

    const logout = () => {
        setFirstName("");
        localStorage.clear();
    };

    return (
        <UserContext.Provider value={{ firstName, updateFirstName, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
