/**
 * FAQ data model and content (Q&A style focused on “how to go to / edit / what does this mean”).
 * - All sign-up related FAQs live under the pre-login "faq/*" keys.
 * - Role-based pages contain only post-login content.
 */

export type FAQSection = {
  id: string;                 // anchor id (e.g., "faq-login", "family-client-schedule")
  title: string;              // section title
  subtitle?: string;          // optional small subtitle
  body?: string | string[];   // Q&A paragraphs (e.g., "Q: ...", "A: ...")
  image?: string;             // optional screenshot filename (NOT rendered)
  table?: string[][];         // optional simple table (kept for compatibility)
};

export type FAQPage = {
  title: string;              // page title shown in the panel header
  sections: FAQSection[];
};

export type FAQBook = Record<string, FAQPage>;

/* ====================================================================
 * FAQ content
 * ==================================================================== */

export const faqData: FAQBook = {

/* =========================
* PRE-LOGIN (split into multiple pages, titles cleaned)
* ========================= */

// Login
'prelogin/login': {
  title: 'Login',
  sections: [
    {
      id: 'login',
      title: 'Login to your account',
      body: [
        'Q: How do I log in?',
        'A: On the login page, enter your email and password, then click “Sign In”.',
        'Q: What if I forgot my password?',
        'A: Click “Forgot password” to receive a reset link by email.',
      ],
    },
  ],
},

// Role select
'prelogin/role': {
  title: 'Role Selection',
  sections: [
    {
      id: 'role-select',
      title: 'Select a role (on /signup)',
      body: [
        'Q: What happens after I click “Sign Up”?',
        'A: You’ll be asked to choose a role: Family/POA, Carer, or Management.',
        'Q: Which role should I choose?',
        'A: If you want care to look after your client, choose Family/POA. If you are a care worker in an organisation and got an invite code from your manager, choose Carer. If you manage an organisation, choose Management.',
        'Q: Can I change my role later?',
        'A: You can sign out and sign up again with a different role, or use separate accounts. But once an account is created, its role cannot be changed.',
      ],
    },
  ],
},

// Family signup
'prelogin/signup-family': {
  title: 'Sign Up — Family / POA',
  sections: [
    {
      id: 'signup-family',
      title: 'Sign Up — Family / POA',
      body: [
        'Q: How do I sign up as Family/POA?',
        'A: On the role selection screen, choose “Family/POA” and fill in your details.',
        'Q: What does “Submit” do?',
        'A: It creates your Family/POA account and redirects you to the Login page, then click on "Login" to enter.',
        'Q: What if my email is already registered?',
        'A: Enter your password directly to login. If you forgot your password, go back to the login page and click on “Forgot password” and you will receive an email with instructions to reset it.',
      ],
    },
  ],
},

// Carer signup
'prelogin/signup-carer': {
  title: 'Sign Up — Carer',
  sections: [
    {
      id: 'signup-carer',
      title: 'Sign Up — Carer',
      body: [
        'Q: How do I sign up as Carer?',
        'A: On the role selection screen, choose “Carer” and complete the registration form.',
        'Q: What does “Submit” do?',
        'A: It finalises your Carer account and opens your dashboard.',
        'Q: Can I see all clients?',
        'A: Carers only see clients assigned by the organisation.',
      ],
    },
  ],
},

// Management: choose org flow
'prelogin/mgmt-org-choice': {
  title: 'Management — Create or Join Organisation',
  sections: [
    {
      id: 'mgmt-org-choice',
      title: 'Management — Create or Join an Organisation',
      body: [
        'Q: I chose Management — what’s next?',
        'A: You’ll pick whether to create a new organisation or join an existing one using an invite code.',
        'Q: What does “Create” do?',
        'A: Registers the organisation you manage in our system.',
        'Q: What does “Join” do?',
        'A: Lets you enter an invite code to join an existing organisation set up by another admin.',
      ],
    },
  ],
},

// Management signup
'prelogin/signup-management': {
  title: 'Sign Up — Management',
  sections: [
    {
      id: 'signup-management',
      title: 'Sign Up — Management',
      body: [
        'Q: How do I sign up as Management?',
        'A: After choosing Management, complete the organisation details (create or join).',
        'Q: What does “Submit” do?',
        'A: It registers your organisation account and enables management features.',
        'Q: Can I invite other management users?',
        'A: Yes. Once logged in, go to your Organisation page to invite other managers and carers in your organisation.',
      ],
    },
  ],
},


  /* =========================
   * FAMILY (post-login)
   * ========================= */

  'family/dashboard': {
    title: 'Family / POA — Dashboard',
    sections: [
      {
        id: 'family-dashboard-overview',
        title: 'Main Dashboard',
        body: [
          'Q: What does the main dashboard do?',
          'A: To switch between staff and client schedules, choose either “Staff Schedule” or “Client Schedule”.',
          'Q: What do the “Staff Schedule” / “Client Schedule” options do?',
          'A: They switch the main calendar view to show staff shifts and client items.',
        ],
      },
    ],
  },

  'family/client-schedule': {
    title: 'Family / POA — Client Schedule',
    sections: [
      {
        id: 'family-client-schedule',
        title: 'Calendar view of the client schedule',
        body: [
          'Q: What does the calendar view show?',
          'A: It displays care items scheduled in the selected month for the selected client.',
          'Q: What do the “Left/Right” arrows on top of the calendar do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What does the pink-highlighted number represent?',
          'A: It’s the current day. Click it to see all care items for the current month.',
          'Q: What does the blue-highlighted number represent?',
          'A: It indicates a day with care items. Click it to see the care items for that day.',
          'Q: What does “Select a client” do?',
          'A: Changes which client’s schedule is displayed.',
          'Q: What happens when I click on a care item?',
          'A: It opens details for that care item, including last done, next due, frequency, status, comments, and files.',
          'Q: How do I search for a specific care item?',
          'A: Use the search bar to find care items by typing keywords.',
          'Q: What does the “Users with access” button do?',
          'A: Shows who has access to this client’s schedule (organisations and family/POA).',
          'Q: What does the “Print” button do?',
          'A: Opens the print dialog for the current page.',
          'Q: I cannot see any items. Why?',
          'A: Check that a client is selected and the month contains scheduled items.',
        ],
      },
      {
        id: 'family-menu-summary',
        title: 'Menu options (top navigation)',
        subtitle: 'Quick reference for common pages you can access.',
        body: [
          'Q: How do I go to my main dashboard?',
          'A: Click the logo at the top-left to return to the main dashboard.',
          'Q: How do I go to the calendar dashboard for a client?',
          'A: Click “Client Schedule”, then select a client to view their calendar.',
          'Q: How do I go to my client list and edit a client?',
          'A: Click “My Clients”, select a client, then open their profile to edit details or view the schedule.',
          'Q: How do I manage organisation access for a client?',
          'A: Click “Organisation” to approve/reject access requests, revoke current access, or review access history.',
          'Q: How do I view a client’s annual budget and drill into categories?',
          'A: Click “Budget Report”, choose a year, then click a category to see its care items.',
          'Q: How do I go to the transaction history?',
          'A: Click “View Transaction” to see receipts uploaded by carers, including dates and status.',
          'Q: How do I submit a change request for a care item?',
          'A: Open “Request Form”, fill in the requested change, and submit—it goes to Management automatically.',
          'Q: How do I update my account details or sign out?',
          'A: Click your avatar (top banner) to open account settings or sign out.',
          'Q: How do I view and edit my client’s personal details?',
          'A: Click the client avatar (pink banner) to open the client profile and update details.',
          'Q: Where is the “Print” button?',
          'A: Each major page has a “Print” button near the header to open the system print dialog.',
        ],
      },
    ],
  },

  'family/my-clients': {
    title: 'Family / POA — My Clients',
    sections: [
      {
        id: 'family-my-clients',
        title: 'Manage and add new clients',
        body: [
          'Q: How do I add a new client?',
          'A: Click “Add new client” (top-right), fill out the profile, and save.',
          'Q: What does “Add new client” do?',
          'A: Opens the client profile form to create a new record.',
          'Q: What does “Edit / Open profile” do (per row)?',
          'A: Opens that client’s profile for editing details.',
          'Q: What does “View schedule” do (per row)?',
          'A: Opens the calendar view scoped to that client.',
          'Q: Why do I see “Access code” on the profile?',
          'A: The numeric access code links this client across roles/systems; keep it private.',
        ],
      },
    ],
  },

  'family/client-profile': {
    title: 'Family / POA — Client Profile',
    sections: [
      {
        id: 'family-client-profile',
        title: 'Create or update a profile',
        body: [
          'Q: How do I create or update a client profile?',
          'A: Open “Client Profile”, enter or edit the client’s details, and click “Save”.',
          'Q: How do I link a new person if they don’t have an access code?',
          'A: Click “Create one here” to generate an access code, then save it with the profile.',
          'Q: What does “Save” do?',
          'A: Persists all profile changes for the client.',
          'Q: Can I upload/update the client avatar?',
          'A: Yes. Click the avatar area (if enabled) to upload a new image and then save.',
        ],
      },
      {
        id: 'family-access-code',
        title: 'Create new access code',
        body: [
          'Q: What is an access code?',
          'A: It’s a unique personal token for that client, used to link their data and personal information. Do not share it; anyone with this code can access that client’s information.',
          'Q: How do I create a new access code for a client?',
          'A: Click “Create access code” under the access code field, then click “Generate” to get a new code; copy and paste it into the access code field.',
          'Q: What does “Copy” do?',
          'A: Clicking it copies the generated code to your clipboard, then paste it into the access code field and save.',
          'Q: How can I paste the code into the access code field?',
          'A: Click the access code field or anywhere you can type, then use Ctrl+V (for Windows) or Cmd+V (for Mac) to paste, or right-click and select “Paste”.',
        ],
      },
    ],
  },

  'family/organisation-access': {
    title: 'Family / POA — Organisation Access',
    sections: [
      {
        id: 'family-organisation-access',
        title: 'Manage organisation access',
        body: [
          'Q: How do I manage organisation access for a specific client?',
          'A: Go to “Organisation”, use “Select a Client” to pick the client, then approve/reject requests or revoke access as needed.',
          'Q: What does “Approve” do?',
          'A: Grants the requesting organisation access to the client’s data or schedule.',
          'Q: What does “Reject” do?',
          'A: Denies the request and preserves current access.',
          'Q: What does “Revoke” do?',
          'A: Removes existing organisation access for the selected client.',
          'Q: Where can I see access history?',
          'A: Organisations that previously have access but no longer do will be listed under the "Organisation Access Revoked" section".',
        ],
      },
    ],
  },

  'family/budget-report': {
    title: 'Family / POA — Budget Report',
    sections: [
      {
        id: 'family-budget-report',
        title: 'Annual budget & Category budget',
        body: [
          'Q: What does the "Budget Report" page do?',
          'A: This page shows a client‘s annual budget and remaining balance. Select a year to see total budget, spent to date, and remaining balance.',
          'Q: How do I drill into a category’s care items?',
          'A: Click the category to view item-level spend.',
          'Q: What does the “Year” selector do?',
          'A: Changes the reporting year and recalculates totals.',
        ],
      },
    ],
  },

  'family/view-transaction': {
    title: 'Family / POA — View Transactions',
    sections: [
      {
        id: 'family-view-transactions',
        title: 'All receipts uploaded by carers',
        body: [
          'Q: What does the "View Transactions" page do?',
          'A: You can view and search all receipts on this page; Status shows pending (haven‘t been seen by the management) or adopted (checked by the management)',
          'Q: How do I search for a specific receipt?',
          'A: Use the search bar on the top right of the page to find receipts by typing keywords.',
        ],
      },
    ],
  },

  'family/request-form': {
    title: 'Family / POA — Request of Change Form',
    sections: [
      {
        id: 'family-request-form',
        title: 'Submit a change request',
        body: [
          'Q: What does the "Request Form" page do?',
          'A: You can send a change request for a care item to the management.',
          'Q: What does “Submit” do?',
          'A: Sends your change request to Management automatically for review.',
          'Q: What does “Cancel/Close” do?',
          'A: Dismisses the form without sending a request.',
        ],
      },
    ],
  },

  // Family / POA — Update Details
  'family/update-details': {
  title: 'Family / POA — Update Details',
  sections: [
    {
      id: 'family-update-details',
      title: 'Manage your account details',
      body: [
            'Q: What does the "Update Details" page do?',
            'A: It lets you change your email and password for this Family/POA account.',
            'Q: What is this password for?',
            'A: It’s the password for this Family/POA account, use to log in to this account and manage your client.',
            'Q: Whose email address is this?',
            'A: It’s the email you (as a Family/POA) use to log in to this account and manage your client.',
      ],
    },
  ],
},


'family/staff-schedule': {
    title: 'Family — Staff Schedule',
    sections: [
     {
        id: 'family-staff-schedule',
        title: 'Staff Schedules',
        body: [
            'Q: What does the "Staff Schedule" page do?',
            'A: It lets you view and manage the schedules of all staff members.',
        ],
      },
    ],
  },

  

  /* =========================
   * CARER (post-login)
   * ========================= */

  'carer/dashboard': {
    title: 'Carer — Dashboard',
    sections: [
      {
        id: 'carer-dashboard-overview',
        title: 'Choose a view',
        body: [
          'Q: How do I switch between staff and client schedules?',
          'A: On the main dashboard, choose either “Staff Schedule” or “Client Schedule”.',
          'Q: What do the “Staff Schedule” / “Client Schedule” options do?',
          'A: They switch the main calendar view to show staff vs. client items.',
          'Q: What happens if no client is selected?',
          'A: You’ll see “No client selected”. Use “Select a client” to pick one before viewing items.',
        ],
      },
    ],
  },

  'carer/client-schedule': {
    title: 'Carer — Client Schedule',
    sections: [
      {
        id: 'carer-client-schedule',
        title: 'Calendar view of your assigned clients',
        body: [
          'Q: What does the calendar show?',
          'A: It displays care items scheduled in the selected month for the selected (assigned) client.',
          'Q: How do I switch the client I am viewing?',
          'A: Use “Select a client” (or the Assigned client dropdown) to choose another client you are assigned to.',
          'Q: What do the Prev/Next (Left/Right) arrows do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month directly?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What happens when I click a care item?',
          'A: The details open, showing last done, next due, frequency, status, comments, and files.',
          'Q: How do I mark a care item as completed?',
          'A: Open the item and click “Mark as completed”; add notes/files if required, then save.',
          'Q: Can I print this schedule?',
          'A: Yes. Click the “Print” button near the header.',
        ],
      },
    ],
  },

  'carer/client-profile': {
    title: 'Carer — Client Profile',
    sections: [
      {
        id: 'carer-client-profile',
        title: 'View and add client notes',
        body: [
          'Q: How do I view a client and add notes?',
          'A: Open the client profile to see their picture, name, DOB, and notes. Add your note and click “Save notes”.',
          'Q: What does “Save notes” do?',
          'A: Saves your newly added or edited notes to the client profile.',
          'Q: Who can see my notes?',
          'A: Notes are visible to permitted roles (e.g., Management/Family/POA) per organisation policy.',
        ],
      },
    ],
  },

  'carer/update-details': {
    title: 'Carer — Update Details',
    sections: [
      {
        id: 'carer-update-details',
        title: 'Manage your account details',
        body: [
            'Q: What does the "Update Details" page do?',
            'A: It lets you change your email and password for this Carer account.',
            'Q: What is this password for?',
            'A: It’s the password for this Carer account, use to log in to this account and manage your client.',
            'Q: Whose email address is this?',
            'A: It’s the email you (as a Carer) use to log in to this account and manage your client.',
        ],
      },
    ],
  },

  'carer/budget-report': {
    title: 'Carer — Budget Report',
    sections: [
      {
        id: 'carer-budget-report',
        title: 'Annual budget & Category budget',
        body: [
          'Q: How do I view yearly budget and remaining balance?',
          'A: Open “Budget Report” to see total budget, spent to date, and remaining balance.',
          'Q: How do I drill into category or item-level spend?',
          'A: Click a category to see its sub-categories and item-level details.',
          'Q: What does the “Year” selector do?',
          'A: Changes the reporting year for the budget figures.',
        ],
      },
    ],
  },

  'carer/view-transactions': {
    title: 'Carer — View Transactions',
    sections: [
      {
        id: 'carer-view-transactions',
        title: 'Receipts & file management',
        body: [
          'Q: How do I review and upload transactions?',
          'A: Open “View Transactions” to see purchases/refunds, who uploaded them, and any linked care items. Use the upload flow to add new transactions and attach receipts.',
          'Q: What does “Upload transaction” do?',
          'A: Starts a new transaction entry where you can add line items and totals.',
          'Q: What does “Attach receipt” do?',
          'A: Lets you upload images/PDFs and associate them with the transaction.',
        ],
      },
    ],
  },

  'carer/staff-schedule': {
    title: 'Carer — Staff Schedule',
    sections: [
     {
        id: 'carer-staff-schedule',
        title: 'Staff Schedules',
        body: [
            'Q: What does the "Staff Schedule" page do?',
            'A: It lets you view and manage the schedules of all staff members.',
        ],
      },
    ],
  },
  



  /* =========================
   * MANAGEMENT (post-login)
   * ========================= */

  'management/dashboard': {
    title: 'Management — Dashboard',
    sections: [
      {
        id: 'management-dashboard-overview',
        title: 'Overview & navigation',
        body: [
          'Q: Where can I review pending items at a glance?',
          'A: Use the dashboard cards for pending access requests, receipts awaiting review, and change requests.',
          'Q: How do I navigate to management tools quickly?',
          'A: Use the top navigation: Care Items, View Transactions, Budget Report, Request Log, Organisation, and more.',
          'Q: Can I filter by site or team?',
          'A: If enabled, use the site/team filter at the top of the dashboard.',
        ],
      },
    ],
  },

  'management/client-schedule': {
    title: 'Management — Client Schedule',
    sections: [
      {
        id: 'management-client-schedule',
        title: 'Client Schedules',
        body: [
          'Q: What does the calendar show?',
          'A: It displays care items scheduled in the selected month for the selected (assigned) client.',
          'Q: How do I switch the client I am viewing?',
          'A: Use “Select a client” (or the Assigned client dropdown) to choose another client you are assigned to.',
          'Q: What do the Prev/Next (Left/Right) arrows do?',
          'A: They move the calendar backward/forward by one month.',
          'Q: How do I select a different month directly?',
          'A: Click the calendar icon next to the title to open a month picker.',
          'Q: What happens when I click a care item?',
          'A: The details open, showing last done, next due, frequency, status, comments, and files.',
          'Q: How do I mark a care item as completed?',
          'A: Open the item and click “Mark as completed”; add notes/files if required, then save.',
          'Q: Can I print this schedule?',
          'A: Yes. Click the “Print” button near the header.',
        ],
      },
    ],
  },

  'management/client-list': {
    title: 'Management — Client List',
    sections: [
      {
        id: 'client-list',
        title: 'Manage clients',
        body: [
          'Q: How do I register a new client?',
          'A: Go to “Client List”, click “Add Client”, and fill in the required details.',
        ],
      },
    ],
  },

  'management/add-care-items': {
    title: 'Management — Add Care Items',
    sections: [
      {
        id: 'add-care-item',
        title: 'Create care items',
        body: [
          'Q: How do I add or edit a care item template for clients?',
          'A: Go to “Care Items”, create a new template or edit an existing one, then assign it to clients as needed.',
          'Q: Can I import items from CSV?',
          'A: If enabled by your organisation, use the “Import” option on the Care Items page.',
        ],
      },
    ],
  },

  'management/view-transactions': {
    title: 'Management — View Transactions',
    sections: [
      {
        id: 'mgmt-transactions',
        title: 'Audit & approval',
        body: [
          'Q: How do I review receipts uploaded by carers?',
          'A: Open “View Transactions” to filter by client, date, or status, then open a receipt to inspect details.',
          'Q: What do “Approve / Reject” actions do?',
          'A: “Approve” confirms the expense; “Reject” sends it back for correction with your notes.',
          'Q: Can I export transactions?',
          'A: Use the export/download controls (if enabled) to get a CSV or PDF for auditing.',
        ],
      },
    ],
  },

  'management/budget-report': {
    title: 'Management — Budget Report',
    sections: [
      {
        id: 'mgmt-budget',
        title: 'Annual budget & Category budget',
        body: [
          'Q: How do I monitor budget utilisation across clients?',
          'A: Open “Budget Report”, pick a year, and review totals, spent to date, and remaining balances per client or category.',
          'Q: How do I drill into overspend risks?',
          'A: Click a category/client row to view item-level spend and trends.',
        ],
      },
    ],
  },

  'management/request-log': {
    title: 'Management — Request Log',
    sections: [
      {
        id: 'mgmt-request-log',
        title: 'Change requests',
        body: [
          'Q: How do I review change requests from Family/POA?',
          'A: Open “Request Log”, select a request to read details, and choose Approve or Reject with comments.',
          'Q: What happens after I approve or reject?',
          'A: The requester is notified, and the system updates the related care item if applicable.',
        ],
      },
    ],
  },

  'management/organisation-access': {
    title: 'Management — Organisation Access',
    sections: [
      {
        id: 'management-organisation',
        title: 'Access requests & revocations',
        body: [
          'Q: How do I approve or revoke an organisation’s access to a client?',
          'A: Go to “Organisation”, open the relevant client, then approve incoming requests or revoke existing access.',
          'Q: Can I see access history?',
          'A: Yes. Use the history view to audit previous grants and revocations.',
        ],
      },
    ],
  },

  'management/client-profile': {
    title: 'Management — Client Profile',
    sections: [
      {
        id: 'mgmt-client-profile',
        title: 'Review & edit client details',
        body: [
          'Q: Who‘s profile is this?',
          'A: The client you currently have selected and their name are shown in the center of the pink banner.',
          'Q: How do I update a client’s profile on behalf of the organisation?',
          'A: Open the client profile, edit the necessary fields, and click “Save”.',
          'Q: How do I regenerate an access code if needed?',
          'A: Use “Generate Access Code”; remember this numeric code is the client’s personal token—keep it secure.',
        ],
      },
    ],
  },

    // Management — Update Details
    'management/update-details': {
    title: 'Management — Update Details',
    sections: [
     {
        id: 'management-update-details',
        title: 'Manage your account details',
        body: [
            'Q: What does the "Update Details" page do?',
            'A: It lets you change your email and password for this Management account.',
            'Q: What is this password for?',
            'A: It’s the password for this Management account, use to log in to this account and manage your client.',
            'Q: Whose email address is this?',
            'A: It’s the email you (as a Management) use to log in to this account and manage your client.',
        ],
      },
    ],
  },

    'management/staff-schedule': {
    title: 'Management — Staff Schedule',
    sections: [
     {
        id: 'management-staff-schedule',
        title: 'Manage staff schedules',
        body: [
            'Q: What does the "Staff Schedule" page do?',
            'A: It lets you view and manage the schedules of all staff members.',
            'Q: How do I add a new staff member?',
            'A: Click the "Add Staff" button and fill in the required details.',
        ],
      },
    ],
  },

  'management/staff-list': {
    title: 'Management — Staff List',
    sections: [
     {
        id: 'management-staff-list',
        title: 'View staff members',
        body: [
            'Q: What does the "Staff List" page do?',
            'A: It lets you view and manage the details of all staff members.',
            'Q: How do I add a new staff member?',
            'A: Click the "Add Staff" button and fill in the required details.',
        ],
      },
    ],
  },

};
