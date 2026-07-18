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
//  - fees     : full fee access — totals, admission, summary report (admin)
//  - payments : record a payment + view a student's payment history only
//               (NO totals/paid/left, no summary). A subset of 'fees'.
//  - users    : creating login accounts & assigning roles (developer only)
export const FEATURES = ['students', 'teachers', 'inventory', 'fees', 'payments', 'users'];

// Which features each role can access.
export const ROLE_FEATURES = {
  developer: ['users'], // manages accounts only
  admin: ['students', 'teachers', 'inventory', 'fees'], // 'fees' implies full payment access
  coordinator: ['students', 'inventory', 'payments'], // can record/view payments, not totals
};

export function featuresForRole(role) {
  return ROLE_FEATURES[role] || [];
}

export function roleCan(role, feature) {
  return featuresForRole(role).includes(feature);
}
