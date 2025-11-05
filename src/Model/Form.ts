export interface ButtonProps {
  type: 'button' | 'submit' | 'reset';
  title: string;
  className: string;
  loading?: boolean;
  disabled?: boolean;
  handleClick?: () => void;
  tooltip?: string;
  icon?: any;
}
