import React, {
    useCallback,
    useState,
    useEffect,
    useLayoutEffect,
    Suspense,
    lazy,
} from "react";
import { Layout } from "../../components/layout";
import { ThemeProvider } from "styled-components";
import { PrivateRoute } from "../../components/private-route";
import { Redirect, Route, Switch, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { UniversalSpinner } from "../universal-spinner";
import { GlobalStyle } from "./styled.js";
import { useDispatch } from "react-redux";
import MewConnect from "@myetherwallet/mewconnect-web-client";
import Web3Modal from "web3modal";
import { INFURA_ID } from "../../env";
import {
    getSupportedTokens,
    getUserBalances,
    postSelectedAsset,
    postSelectedFiat,
    postLogout,
} from "../../actions/loopring";
import { BottomUpContainer } from "../../components/bottom-up-container";
import { FiatChooser, supportedFiats } from "../fiat-chooser";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LazyAuth = lazy(() => import("../auth"));
const LazyDashboard = lazy(() => import("../dashboard"));

const commonColors = {
    error: "#c62828",
    warning: "#FF6F00",
    primary: "#1c60ff",
};

const light = {
    ...commonColors,
    background: "#e0e0e0",
    foreground: "#f2f2f2",
    text: "#0e062d",
    shadow: "rgba(0, 0, 0, 0.4)",
    placeholder: "#b3b3b3",
    loader: "#a6a6a6",
};

const dark = {
    ...commonColors,
    background: "#212121",
    foreground: "#333",
    text: "#F1F9D2",
    shadow: "rgba(0, 0, 0, 0.4)",
    placeholder: "#666666",
    loader: "#595959",
};

const lightWeb3ModalTheme = {
    background: light.background,
    main: light.text,
    secondary: light.text,
    hover: light.foreground,
};

const darkWeb3ModalTheme = {
    background: dark.background,
    main: dark.text,
    secondary: dark.text,
    hover: dark.foreground,
};

const web3ModalOptions = {
    cacheProvider: false,
    providerOptions: {
        mewconnect: {
            package: MewConnect,
            options: {
                infuraId: INFURA_ID,
            },
        },
    },
};

export const getWeb3Modal = () => new Web3Modal(web3ModalOptions);

export let selectedTheme = light;

export const App = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const {
        web3Instance,
        loopringAccount,
        loopringWallet,
        loopringExchange,
        supportedTokens,
        balances,
        selectedAsset,
        selectedFiat,
        loadingSupportedTokens,
        loadingBalances,
    } = useSelector((state) => ({
        web3Instance: state.web3.instance,
        loopringAccount: state.loopring.account,
        loopringWallet: state.loopring.wallet,
        loopringExchange: state.loopring.exchange,
        supportedTokens: state.loopring.supportedTokens.data,
        balances: state.loopring.balances.data,
        selectedAsset: state.loopring.selectedAsset,
        selectedFiat: state.loopring.selectedFiat,
        loadingSupportedTokens: !!state.loopring.supportedTokens.loadings,
        loadingBalances: !!state.loopring.balances.loadings,
    }));

    const [lightTheme, setLightTheme] = useState(true);
    const [changingFiat, setChangingFiat] = useState(false);
    const [logged, setLogged] = useState(false);
    const [universallyLoading, setUniversallyLoading] = useState(false);

    // setting up local storage -saved theme
    useEffect(() => {
        const cachedTheme =
            localStorage.getItem("loopring-pay-theme") || "light";
        const lightTheme = cachedTheme === "light";
        setLightTheme(lightTheme);
        selectedTheme = lightTheme ? light : dark;
        web3ModalOptions.theme = lightTheme
            ? lightWeb3ModalTheme
            : darkWeb3ModalTheme;
    }, [dispatch]);

    // setting up selected fiat on boot and logout
    useEffect(() => {
        if (selectedFiat) {
            return;
        }
        const fiatFromLocalStorage = localStorage.getItem("loopring-pay-fiat");
        dispatch(
            postSelectedFiat(
                fiatFromLocalStorage
                    ? JSON.parse(fiatFromLocalStorage)
                    : supportedFiats[0]
            )
        );
    }, [dispatch, selectedFiat]);

    useEffect(() => {
        if (loopringWallet && loopringAccount) {
            dispatch(getSupportedTokens());
        }
    }, [history, dispatch, loopringAccount, loopringWallet]);

    useEffect(() => {
        if (
            loopringWallet &&
            loopringAccount &&
            supportedTokens &&
            supportedTokens.length > 0
        ) {
            dispatch(
                getUserBalances(
                    loopringAccount,
                    loopringWallet,
                    supportedTokens,
                    selectedFiat
                )
            );
        }
    }, [
        dispatch,
        supportedTokens,
        loopringAccount,
        loopringWallet,
        selectedFiat,
    ]);

    // setting the default-selected asset (the one with the most fiat value)
    useEffect(() => {
        if (balances && balances.length > 0 && selectedAsset === null) {
            const firstNonZeroBalance = balances.find(
                (balance) => !balance.balance.isZero()
            );
            dispatch(postSelectedAsset(firstNonZeroBalance || balances[0]));
        }
    }, [balances, dispatch, selectedAsset, supportedTokens]);

    useLayoutEffect(() => {
        history.push(logged ? "/dashboard" : "/auth");
    }, [history, logged]);

    // shows spinner when logging in and still loading data
    useEffect(() => {
        setUniversallyLoading(
            !logged && (loadingBalances || loadingSupportedTokens)
        );
    }, [loadingBalances, loadingSupportedTokens, logged]);

    useEffect(() => {
        setLogged(
            !!(
                web3Instance &&
                loopringAccount &&
                loopringWallet &&
                loopringExchange &&
                supportedTokens &&
                supportedTokens.length > 0 &&
                balances &&
                balances.length > 0 &&
                selectedAsset
            )
        );
    }, [
        balances,
        loopringAccount,
        loopringExchange,
        loopringWallet,
        selectedAsset,
        supportedTokens,
        web3Instance,
    ]);

    const handleThemeChange = useCallback(() => {
        const newLightTheme = !lightTheme;
        const textTheme = newLightTheme ? "light" : "dark";
        localStorage.setItem("loopring-pay-theme", textTheme);
        web3ModalOptions.theme = newLightTheme
            ? lightWeb3ModalTheme
            : darkWeb3ModalTheme;
        setLightTheme(newLightTheme);
        selectedTheme = newLightTheme ? light : dark;
    }, [lightTheme]);

    const handleFiatClick = useCallback(() => {
        setChangingFiat(true);
    }, []);

    const handleFiatBottomUpContainerClose = useCallback(() => {
        setChangingFiat(false);
    }, []);

    const handleFiatChange = useCallback(
        (fiat) => {
            localStorage.setItem("loopring-pay-fiat", JSON.stringify(fiat));
            dispatch(postSelectedFiat(fiat));
            setChangingFiat(false);
        },
        [dispatch]
    );

    const handleLogoutClick = useCallback(() => {
        dispatch(postLogout());
    }, [dispatch]);

    return (
        <ThemeProvider theme={lightTheme ? light : dark}>
            <GlobalStyle />
            <Layout
                lightTheme={lightTheme}
                onThemeChange={handleThemeChange}
                // show fiat selector only if actually logged in
                fiat={logged ? selectedFiat : null}
                onFiatClick={handleFiatClick}
                logged={logged}
                onLogoutClick={handleLogoutClick}
            >
                <Suspense fallback={<UniversalSpinner open />}>
                    <Switch>
                        <PrivateRoute
                            path="/dashboard"
                            condition={logged}
                            component={LazyDashboard}
                            redirectTo="/auth"
                        />
                        <Route path="/auth" component={LazyAuth} />
                        <Redirect to="/dashboard" />
                    </Switch>
                </Suspense>
                <BottomUpContainer
                    open={changingFiat}
                    onClose={handleFiatBottomUpContainerClose}
                >
                    <FiatChooser onChange={handleFiatChange} />
                </BottomUpContainer>
            </Layout>
            <UniversalSpinner open={universallyLoading} />
            <ToastContainer
                className="custom-toast-root"
                toastClassName="custom-toast-container"
                bodyClassName="custom-toast-body"
                position="top-right"
                closeButton={false}
                transition={Slide}
                limit={3}
            />
        </ThemeProvider>
    );
};
