export function getDashboardMenu(role) {
    const managementMenu = [
      { id: "dashboard", label: "Dashboard", icon: "stats-chart-outline" },
      {
        id: "directives",
        label: "Directives",
        icon: "chatbubbles-outline",
        children: [
          { id: "directives-pending", label: "Pending", badge: 135 },
          { id: "directives-closed", label: "Closed", badge: 10 },
          { id: "directives-create", label: "Create New" },
        ],
      },
      { id: "two-year-plan", label: "Two Year Plan", icon: "calendar-outline" },
      {
        id: "personal-calendar",
        label: "Personal Calendar",
        icon: "calendar-number-outline",
      },
      {
        id: "minutes-repo",
        label: "Minutes Repository",
        icon: "document-text-outline",
      },
    ];

    const userMenu = [
      { id: "personal-calendar", label: "Personal Calendar", icon: "calendar-number-outline" },
      { id: "directive", label: "Directives", icon: "chatbubbles-outline" },
      { id: "two-year-plan", label: "Two Year Plan", icon: "calendar-outline" },
      { id: "minutes-of-meeting", label: "Minutes of Meeting", icon: "document-text-outline" },
    ];
  
    if (role === "user") {
      return userMenu;
    }else{
      return managementMenu;
    }
  }
  
  export function getDashboardHeaderTitle(role) {
    if (role === "user") {
      return "USER (Performance Dashboard)";
    }
    return "EXECUTIVE MANAGEMENT (Performance Dashboard)";
  }