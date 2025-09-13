export interface Email {
  username: string;
  domain: string;
  provider: string;
  status: string;
  subscription: string;
  creationDate?: string;
  expiryDate?: string;
  customer?: string;
  users?: string[]; // always an array
  password?: string;
}

export interface DomainWithEmails {
  _id: string;
  domainName: string;
  emails: Email[];
}
