import { styled } from "../design-system"

const StyledRoot = styled("div", {
  lineHeight: 2,
  fontSize: '$2',
  padding: '$6'
});

const StyledList = styled("ul", {
})

const StyledGroup = styled("li", {
  color: "$slate11",
  paddingBottom: "$4",
  marginBottom: "$4",
  borderBottom: "1px solid $slate5"

})

const StyledItem = styled("li", {
  color: "$slate11",
  paddingTop: "$2"
})

const StyledSubList = styled("ul", {
})

const StyledSubItem = styled("li", {
  lineHeight: 2.5,
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  variants: {
    selected: {
      true: {
        color: "$blue10",
        fontWeight: 500
      }
    }
  }
})

const StyledItemTitle = styled("h4", {
  color: "$slate12",
  fontSize: "$3",
  fontWeight: 500
})

const StyledSubItemTitle = styled("h5", {
  color: "$slate12",
  fontWeight: 500,
  paddingTop: "$2"
})

type IProps = {
  onClick: (item: any) => void;
  defaultSelectedKeys: string[];
  items: any;
  selectedKeys: string[];
}

export default (props: IProps) => {
  const menuItems = props.items.map((item: any, i: number) => {
    const children = item.children.map((child: any, j: number) => {
      return child.children ?
        <StyledItem key={j}>
          <StyledSubItemTitle>{child.label}</StyledSubItemTitle>
          <StyledSubList>{child.children.map((subItem: any, k: number) => {
            return <StyledSubItem key={k} selected={props.selectedKeys.indexOf(subItem.key) > -1} onClick={() => {
              props.onClick(subItem);
            }}>{subItem.label}</StyledSubItem>
          })}</StyledSubList>
        </StyledItem> :
        <StyledSubItem key={j} selected={props.selectedKeys.indexOf(child.key) > -1} onClick={() => {
          props.onClick(child);
        }}>{child.label}</StyledSubItem>
    });

    return (
      <StyledGroup key={i}>
        <StyledItemTitle>{item.label}</StyledItemTitle>
        <StyledList>
          {children}
        </StyledList>
      </StyledGroup>
    )
  });

  return <StyledRoot css={props.css}>
    <StyledList>
      {menuItems}
    </StyledList>
  </StyledRoot>
}