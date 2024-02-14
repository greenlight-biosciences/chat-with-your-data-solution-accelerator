import { useRef, useState, useEffect } from "react";
import { Stack } from "@fluentui/react";
import { BroomRegular, DismissRegular, SquareRegular } from "@fluentui/react-icons";

import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import rehypeRaw from "rehype-raw"; 
import { v4 as uuidv4 } from "uuid";

import styles from "./Chat.module.css";

import {
    ChatMessage,
    ConversationRequest,
    conversationApi,
    customConversationApi,
    Citation,
    ToolMessageContent,
    ChatResponse
} from "../../api";
import { Answer } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";

const Chat = () => {
    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showLoadingMessage, setShowLoadingMessage] = useState<boolean>(false);
    const [activeCitation, setActiveCitation] = useState<[content: string, id: string, title: string, filepath: string, url: string, metadata: string]>();
    const [isCitationPanelOpen, setIsCitationPanelOpen] = useState<boolean>(false);
    const [answers, setAnswers] = useState<ChatMessage[]>([]);
    const abortFuncs = useRef([] as AbortController[]);
    const [conversationId, setConversationId] = useState<string>(uuidv4());
    const [logoFooterURL, setLogoFooterURL] = useState<string>('');


    useEffect(() => {
        const logo_footer_url = import.meta.env.VITE_GLB_LOGO_FOOTER_URL;
        setLogoFooterURL(logo_footer_url)
    }, []);


    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        setIsLoading(true);
        setShowLoadingMessage(true);
        const abortController = new AbortController();
        abortFuncs.current.unshift(abortController);

        const userMessage: ChatMessage = {
            role: "user",
            content: question
        };

        const request: ConversationRequest = {
            id: conversationId,
            messages: [...answers, userMessage]
        };

        let result = {} as ChatResponse;
        try {
            const response = await customConversationApi(request, abortController.signal);
            if (response?.body) {
                
                const reader = response.body.getReader();
                let runningText = "";
                while (true) {
                    const {done, value} = await reader.read();
                    if (done) break;

                    var text = new TextDecoder("utf-8").decode(value);
                    const objects = text.split("\n");
                    objects.forEach((obj) => {
                        try {
                            runningText += obj;
                            result = JSON.parse(runningText);
                            setShowLoadingMessage(false);
                            setAnswers([...answers, userMessage, ...result.choices[0].messages]);
                            runningText = "";
                        }
                        catch { }
                    });
                }
                setAnswers([...answers, userMessage, ...result.choices[0].messages]);
            }
            
        } catch ( e )  {
            if (!abortController.signal.aborted) {
                console.error(result);
                alert("An error occurred. Please try again. If the problem persists, please contact the site administrator.")
            }
            setAnswers([...answers, userMessage]);
        } finally {
            setIsLoading(false);
            setShowLoadingMessage(false);
            abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
        }

        return abortController.abort();
    };

    const clearChat = () => {
        lastQuestionRef.current = "";
        setActiveCitation(undefined);
        setAnswers([]);
        setConversationId(uuidv4());
    };

    const stopGenerating = () => {
        abortFuncs.current.forEach(a => a.abort());
        setShowLoadingMessage(false);
        setIsLoading(false);
    }

    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [showLoadingMessage]);

    const onShowCitation = (citation: Citation) => {
        setActiveCitation([citation.content, citation.id, citation.title ?? "", citation.filepath ?? "", "", ""]);
        setIsCitationPanelOpen(true);
    };

    const parseCitationFromMessage = (message: ChatMessage) => {
        if (message.role === "tool") {
            try {
                const toolMessage = JSON.parse(message.content) as ToolMessageContent;
                return toolMessage.citations;
            }
            catch {
                return [];
            }
        }
        return [];
    }

    return (
        <div className={styles.container}>
            <Stack horizontal className={styles.chatRoot}>
                <div className={styles.chatContainer}>
                    {!lastQuestionRef.current ? (
                        <Stack className={styles.chatEmptyState}>
                            <img
                                src={logoFooterURL}
                                className={styles.chatIcon}
                                aria-hidden="true"
                            />
                            <h1 className={styles.chatEmptyStateTitle}>Start chatting</h1>
                            <h2 className={styles.chatEmptyStateSubtitle}>This chatbot is configured to answer your questions</h2>
                        </Stack>
                    ) : (
                        <div className={styles.chatMessageStream} style={{ marginBottom: isLoading ? "40px" : "0px"}}>
                            {answers.map((answer, index) => (
                                <>
                                    {answer.role === "user" ? (
                                        <div className={styles.chatMessageUser}>
                                            <div className={styles.chatMessageUserMessage}>{answer.content}</div>
                                        </div>
                                    ) : (
                                        answer.role === "assistant" ? <div className={styles.chatMessageGpt}>
                                            <Answer
                                                answer={{
                                                    answer: answer.content,
                                                    citations: parseCitationFromMessage(answers[index - 1]),
                                                }}
                                                onCitationClicked={c => onShowCitation(c)}
                                            />
                                        </div> : null
                                    )}
                                </>
                            ))}
                            {showLoadingMessage && (
                                <>
                                    <div className={styles.chatMessageUser}>
                                        <div className={styles.chatMessageUserMessage}>{lastQuestionRef.current}</div>
                                    </div>
                                    <div className={styles.chatMessageGpt}>
                                        <Answer
                                            answer={{
                                                answer: "Generating answer...",
                                                citations: []
                                            }}
                                            onCitationClicked={() => null}
                                        />
                                    </div>
                                </>
                            )}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    )}

                    <Stack horizontal className={styles.chatInput}>
                        {isLoading && (
                            <Stack 
                                horizontal
                                className={styles.stopGeneratingContainer}
                                role="button"
                                aria-label="Stop generating"
                                tabIndex={0}
                                onClick={stopGenerating}
                                onKeyDown={e => e.key === "Enter" || e.key === " " ? stopGenerating() : null}
                                >
                                    <SquareRegular className={styles.stopGeneratingIcon} aria-hidden="true"/>
                                    <span className={styles.stopGeneratingText} aria-hidden="true">Stop generating</span>
                            </Stack>
                        )}
                        <BroomRegular
                            className={styles.clearChatBroom}
                            style={{ background: isLoading || answers.length === 0 ? "#BDBDBD" : "radial-gradient(109.81% 107.82% at 100.1% 90.19%, var(--gradient-color1) 33.63%, var(--gradient-color2) 70.31%, var(--gradient-color3) 100%)", 
                                     cursor: isLoading || answers.length === 0 ? "" : "pointer"}}
                            onClick={clearChat}
                            onKeyDown={e => e.key === "Enter" || e.key === " " ? clearChat() : null}
                            aria-label="Clear session"
                            role="button"
                            tabIndex={0}
                        />
                        <QuestionInput
                            clearOnSend
                            placeholder="Type a new question..."
                            disabled={isLoading}
                            onSend={question => makeApiRequest(question)}
                        />
                    </Stack>
                </div>
                {answers.length > 0 && isCitationPanelOpen && activeCitation && (
                <Stack.Item className={styles.citationPanel}>
                    <Stack horizontal className={styles.citationPanelHeaderContainer} horizontalAlign="space-between" verticalAlign="center">
                        <span className={styles.citationPanelHeader}>Citations</span>
                        <DismissRegular className={styles.citationPanelDismiss} onClick={() => setIsCitationPanelOpen(false)}/>
                    </Stack>
                    <h5 className={styles.citationPanelTitle}>{activeCitation[2]}</h5>
                    <ReactMarkdown className={styles.citationPanelContent} children={activeCitation[0]} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}/>
                </Stack.Item>
            )}
            </Stack>
            
        </div>
    );
};

export default Chat;
