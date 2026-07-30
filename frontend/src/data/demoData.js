export const demoUser = {
  id: "user-demo-001",
  name: "Demo User",
  email: "demo@julysmriti.org",
  role: "USER",
  profilePic: "",
};

export const demoSubmissions = [
  { id: "SUB-2026-0012", title: "Campus photographs from July", type: "Photograph", contentTypes: ["Photograph"], attachmentCount: 8, identity: "Anonymous contributor", publicationPermission: "Ask me before any public publication", visibility: "Private", status: "Under review", updatedAt: "28 July 2026", createdAt: "27 July 2026" },
  { id: "SUB-2026-0007", title: "Personal testimony draft", type: "Testimony", contentTypes: ["Story / Testimony"], attachmentCount: 0, identity: "Pseudonym: A July witness", publicationPermission: "Ask me before any public publication", visibility: "Private", status: "Information required", updatedAt: "26 July 2026", createdAt: "24 July 2026" },
  { id: "SUB-2026-0002", title: "Public notice scan", type: "Document", contentTypes: ["Document"], attachmentCount: 1, identity: "Anonymous contributor", publicationPermission: "May publish after approval using my privacy settings", visibility: "Public version", status: "Published", updatedAt: "20 July 2026", createdAt: "18 July 2026" },
];

export const demoSupportRooms = [
  { id: "JS-HELP-00124", title: "Medical follow-up support", status: "Information required", priority: "Urgent", updatedAt: "Today, 4:20 PM", assignedAdmin: "Support Admin", unread: 1 },
  { id: "JS-HELP-00103", title: "Rehabilitation guidance", status: "In progress", priority: "Normal", updatedAt: "25 July 2026", assignedAdmin: "Case Team", unread: 0 },
];

export const demoRoomMessages = {
  "JS-HELP-00124": [
    { id: "m1", sender: "admin", name: "Support Admin", text: "Thank you for the information. Please confirm the latest hospital visit date. Do not send national ID or unrelated medical records.", time: "Today, 3:40 PM" },
    { id: "m2", sender: "user", name: "You", text: "The latest visit was on 27 July. I can provide the requested discharge summary.", time: "Today, 4:02 PM" },
  ],
  "JS-HELP-00103": [
    { id: "m3", sender: "admin", name: "Case Team", text: "Your request is being reviewed. We will post the next update in this room.", time: "25 July, 11:10 AM" },
  ],
};
