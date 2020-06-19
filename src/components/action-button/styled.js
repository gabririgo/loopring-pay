import { Box } from "reflexbox";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const RootButton = styled.button`
    background: rgba(0, 0, 0, 0);
    outline: none;
    border: none;
    cursor: pointer;
`;

export const OuterCircle = styled(Box)`
    border-radius: 50%;
    background: ${(props) =>
        props.dark ? props.theme.background : props.theme.foreground};
    color: ${(props) => props.theme.text};
`;

export const Icon = styled(FontAwesomeIcon)`
    font-size: ${(props) => props.faIconSize}px;
`;

export const Title = styled(Box)`
    color: ${(props) => props.theme.text};
    font-family: "Montserrat";
`;