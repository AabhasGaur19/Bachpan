// ============================================================
//  Roles & feature flags — the SINGLE source of truth.
//
//  To add a new feature:  add its key to FEATURES, then list it under each
//    role that should see it in ROLE_FEATURES, and guard its routes with
//    requireFeature('<key>') in server.js (+ gate the tab on the frontend).
//  To add a new role:     add an entry to ROLE_FEATURES with its allowed keys.
//
//  The frontend never hardcodes this — after login the backend sends the
//  user's allowed feature keys, and the UI shows only those. So changing this
//  file updates both the API's enforcement and what each user sees.
// ============================================================

// Every gate-able feature in the app.
//  - students / teachers / inventory : the three main sections
//  - fees  : seeing & recording student fees (a sub-feature of students)
//  - users : creating login accounts & assigning roles (developer only)
export const FEATURES = ['students', 'teachers', 'inventory', 'fees', 'users'];

// Which features each role can access.
export const ROLE_FEATURES = {
  developer: ['users'], // manages accounts only
  admin: ['students', 'teachers', 'inventory', 'fees'],
  coordinator: ['students', 'inventory'], // students but NOT their fees
};

export function featuresForRole(role) {
  return ROLE_FEATURES[role] || [];
}

export function roleCan(role, feature) {
  return featuresForRole(role).includes(feature);
}
