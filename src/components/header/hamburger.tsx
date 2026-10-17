import { Menu } from "@base-ui/react/menu";
import { UserMenu } from "@/components/header/user-menu";
import { UserAvatar } from "@/components/header/user-avatar";

export const Hamburger = () => {
  return (
    <Menu.Root>
      <Menu.Trigger
        openOnHover
        className={
          "relative inline-flex aspect-square h-full cursor-pointer items-center justify-center rounded-full bg-blue-500 font-bold text-white select-none"
        }
        aria-label="User menu"
      >
        <UserAvatar />
      </Menu.Trigger>

      <UserMenu />
    </Menu.Root>
  );
};