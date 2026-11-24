import { Menu } from "@base-ui/react/menu";
import { menuItem } from "@/components/ui/popup-styles";

export const MenuItem = (props: Menu.Item.Props) => (
  <Menu.Item className={menuItem} {...props} />
);
