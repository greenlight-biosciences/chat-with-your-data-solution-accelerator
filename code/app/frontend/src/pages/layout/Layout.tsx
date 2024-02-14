import { Outlet, Link } from "react-router-dom";
import styles from "./Layout.module.css";
import Azure from "../../assets/Azure.svg";
import { CopyRegular, ShareRegular } from "@fluentui/react-icons";
import { Dialog, Stack, TextField } from "@fluentui/react";
import { useEffect, useState } from "react";

const Layout = () => {
    const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false);
    const [copyClicked, setCopyClicked] = useState<boolean>(false);
    const [copyText, setCopyText] = useState<string>("Copy URL");
    const [pageTitle, setPageTitle] = useState<string>('Default Title');
    const [logoHeaderURL, setLogoHeaderURL] = useState<string>('');

    function setFavicon(url: string): void {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = url;
    }

    useEffect(() => {
        const favicon_url = import.meta.env.VITE_FAVICON_URL;
        setFavicon(favicon_url);

        const logo_header_url = import.meta.env.VITE_GLB_LOGO_HEADER_URL;
        setLogoHeaderURL(logo_header_url);

        const envTeam = import.meta.env.VITE_TEAM;
        let page_title;
        let theme_color1;
        let theme_color2, theme_color3, theme_color4;

        switch (envTeam.toLowerCase()) {
            case "data_science":
                page_title = "GENIE - Data Science";
                theme_color1 = "#CEFEE4";
                theme_color2 = "#9FFDCB";
                theme_color3 = "#2BEDA6";
                theme_color4 = "#00B57F";
                break;
            case "data_management":
                page_title = "GENIE - Data Management";
                theme_color1 = "#FCF3CA";
                theme_color2 = "#FFE691";
                theme_color3 = "#FFC91C";
                theme_color4 = "#D19428";
                break;
            case "process_dev":
                page_title = "GENIE - Process Development";
                theme_color1 = "#D3F7FE";
                theme_color2 = "#A4EDFD";
                theme_color3 = "#35E1F2";
                theme_color4 = "#00A2B3";
                break;
            case "product_dev":
                page_title = "GENIE - Product Development";
                theme_color1 = "#EBE3FF";
                theme_color2 = "#CCB8FF";
                theme_color3 = "#8C59FF";
                theme_color4 = "#4D21B2";
                break;
            case "regulatory":
                page_title = "GENIE - Regulatory";
                theme_color1 = "#FFDEFC";
                theme_color2 = "#FFB0F8";
                theme_color3 = "#F046DD";
                theme_color4 = "#B3009A";
                break;
            default:
                page_title = "<{ERROR}> CONTACT DM TEAM! <{ERROR}>";
                theme_color1 = "#ff0000";
                theme_color2 = "#ff0000";
                theme_color3 = "#ff0000";
                theme_color4 = "#ff0000";
                break;
        }

        setPageTitle(page_title)
        document.title = page_title;
        document.documentElement.style.setProperty("--header-background-color", theme_color2);
        document.documentElement.style.setProperty("--gradient-color1",         theme_color4);
        document.documentElement.style.setProperty("--gradient-color2",         theme_color3);
        document.documentElement.style.setProperty("--gradient-color3",         theme_color1);
    }, []);

    const handleShareClick = () => {
        setIsSharePanelOpen(true);
    };

    const handleSharePanelDismiss = () => {
        setIsSharePanelOpen(false);
        setCopyClicked(false);
        setCopyText("Copy URL");
    };

    const handleCopyClick = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopyClicked(true);
    };

    useEffect(() => {
        if (copyClicked) {
            setCopyText("Copied URL");
        }
    }, [copyClicked]);

    return (
        <div className={styles.layout}>
            <header className={styles.header} role={"banner"}>
                <div className={styles.headerContainer}>
                    <Stack horizontal verticalAlign="center">
                        <img
                            src={logoHeaderURL}
                            className={styles.headerIcon}
                            aria-hidden="true"
                        />
                        <Link to="/" className={styles.headerTitleContainer}>
                            <h3 className={styles.headerTitle}>{pageTitle}</h3>
                        </Link>
                        <div className={styles.shareButtonContainer} role="button" tabIndex={0} aria-label="Share" onClick={handleShareClick} onKeyDown={e => e.key === "Enter" || e.key === " " ? handleShareClick() : null}>
                            <ShareRegular className={styles.shareButton} />
                            <span className={styles.shareButtonText}>Share</span>
                        </div>
                    </Stack>
                </div>
            </header>
            <Outlet />
            <Dialog 
                onDismiss={handleSharePanelDismiss}
                hidden={!isSharePanelOpen}
                styles={{
                    
                    main: [{
                        selectors: {
                          ['@media (min-width: 480px)']: {
                            maxWidth: '600px',
                            background: "#FFFFFF",
                            boxShadow: "0px 14px 28.8px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.2)",
                            borderRadius: "8px",
                            maxHeight: '200px',
                            minHeight: '100px',
                          }
                        }
                      }]
                }}
                dialogContentProps={{
                    title: "Share the web app",
                    showCloseButton: true
                }}
            >
                <Stack horizontal verticalAlign="center" style={{gap: "8px"}}>
                    <TextField className={styles.urlTextBox} defaultValue={window.location.href} readOnly/>
                    <div 
                        className={styles.copyButtonContainer} 
                        role="button" 
                        tabIndex={0} 
                        aria-label="Copy" 
                        onClick={handleCopyClick}
                        onKeyDown={e => e.key === "Enter" || e.key === " " ? handleCopyClick() : null}
                    >
                        <CopyRegular className={styles.copyButton} />
                        <span className={styles.copyButtonText}>{copyText}</span>
                    </div>
                </Stack>
            </Dialog>
        </div>
    );
};

export default Layout;
