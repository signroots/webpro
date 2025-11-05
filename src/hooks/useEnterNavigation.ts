import { useEffect } from "react";
export function useEnterNavigation(formRef: React.RefObject<HTMLFormElement | null>)
{
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;

        // Skip buttons & textareas
        if (
          target.tagName === "TEXTAREA" ||
          (target as HTMLInputElement).type === "submit" ||
          (target as HTMLInputElement).type === "button"
        ) {
          return;
        }

        e.preventDefault();

        const elements = Array.from(
          form.querySelectorAll("input, select, textarea, button")
        ).filter(
          (el: any) =>
            !el.disabled &&
            el.tabIndex !== -1 &&
            el.offsetParent !== null
        );

        const index = elements.indexOf(target);
        const next = elements[index + 1] || elements[0];
        (next as HTMLElement).focus();
      }
    };

    form.addEventListener("keydown", handleKeyDown);
    return () => form.removeEventListener("keydown", handleKeyDown);
  }, [formRef]);
}
