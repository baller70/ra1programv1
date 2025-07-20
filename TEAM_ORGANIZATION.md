# Team Organization Feature

## Overview

The Team Organization feature allows you to group parents into teams (like "Rises as One Red") on the payments page. This creates a folder-like organization system where parents are grouped by their team affiliation.

## Features

### 1. Team Management
- Create new teams with custom names, descriptions, and colors
- Edit existing teams
- Delete teams (only if no parents are assigned)
- View team member counts

### 2. Team Organization
- Group payments by team on the payments page
- Filter payments by specific team
- Visual indicators with team colors
- Toggle between grouped and ungrouped views

### 3. Parent Assignment
- Assign parents to teams
- Bulk assignment operations
- Handle unassigned parents
- Team transfer functionality

## Database Schema Changes

### New Team Model
```prisma
model Team {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  color       String?  // For UI theming
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  parents     Parent[]
  
  @@index([name])
  @@index([isActive])
}
```

### Updated Parent Model
```prisma
model Parent {
  // ... existing fields
  teamId      String?  // Team affiliation
  team        Team?    @relation(fields: [teamId], references: [id], onDelete: SetNull)
  // ... existing relations
  
  @@index([teamId])
}
```

## API Endpoints

### Teams API (`/api/teams`)
- `GET` - List all teams with parent counts
- `POST` - Create new team
- `PUT` - Update existing team
- `DELETE` - Delete team (if no parents assigned)

### Team Assignment API (`/api/teams/assign`)
- `POST` - Assign parents to a team
- `PUT` - Bulk assign multiple parents to teams

### Enhanced Payments API (`/api/payments`)
- Added `teamId` filter parameter
- Enhanced parent data to include team information

## UI Components

### Team Filter
- Dropdown to select specific team or "All Teams"
- "Unassigned" option for parents without teams
- Team member counts displayed

### Team Management Dialog
- Create/edit team form
- Team name, description, and color picker
- Validation for unique team names

### Grouped Display
- Visual team headers with colors
- Payment counts per team
- Collapsible team sections
- Team management actions (edit/delete)

### Team Organization Toggle
- Checkbox to enable/disable team grouping
- Status indicator showing current filter

## Usage Instructions

### Creating Teams

1. Navigate to the Payments page
2. Click "New Team" button
3. Enter team details:
   - **Name**: e.g., "Rises as One Red"
   - **Description**: Optional team description
   - **Color**: Team color for visual identification
4. Click "Create Team"

### Assigning Parents to Teams

1. Use the team dropdown filter
2. Select parents using checkboxes
3. Use bulk operations to assign to teams
4. Or manage individual assignments through parent profiles

### Viewing Team Organization

1. Enable "Group by Team" checkbox
2. Payments will be organized by team folders
3. Each team shows:
   - Team name and color indicator
   - Number of payments in the team
   - Individual parent payment cards
   - Team management options

### Managing Teams

1. Click the settings icon next to team names
2. Edit team details (name, description, color)
3. Delete teams (only if empty)
4. View team statistics and member counts

## Sample Teams

The system comes with these sample teams:

1. **Rises as One Red** - Red team for competitive basketball
2. **Rises as One Blue** - Blue team for competitive basketball  
3. **Thunder Bolts** - Advanced training group
4. **Lightning Strikes** - Intermediate skill level team
5. **Storm Chasers** - Beginner friendly team

## Implementation Status

✅ Database schema updated
✅ API endpoints created
✅ Team management UI
✅ Payment filtering by team
✅ Grouped display with team colors
✅ Team assignment functionality
✅ Sample data migration script

## Next Steps

1. Run database migration to apply schema changes
2. Run the team setup script to create sample teams
3. Test team creation and assignment
4. Assign existing parents to appropriate teams
5. Verify payment filtering and grouping works correctly

## Technical Notes

- Teams use color coding for visual organization
- Soft delete approach - teams can be deactivated rather than deleted
- Parent-team relationship uses foreign key with SET NULL on delete
- Team filtering is implemented at the database level for performance
- UI supports both grouped and ungrouped views for flexibility 