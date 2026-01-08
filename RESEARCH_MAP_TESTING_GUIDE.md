# Research Intelligence Map - Testing Guide

## 📋 Testing Overview

This guide covers how to test the Research Intelligence Map feature and document your findings.

---

## 🧪 Test Environment Setup

### Prerequisites
- [ ] Development server running (`npm run dev`)
- [ ] Supabase project configured
- [ ] Edge functions deployed (or ready to deploy)
- [ ] At least one completed research report available
- [ ] Browser with developer tools open (F12)

### Test Data Requirements
- [ ] Research report with rich content:
  - Executive summary
  - Multiple key findings
  - Detailed analysis
  - Insights
  - Conclusion
  - Sources

---

## 📝 Test Cases

### Test Case 1: Access Intelligence Map from Report View

**Objective**: Verify the "View Intelligence Map" button appears and navigates correctly.

**Steps**:
1. Navigate to a completed research report (`/report/:id`)
2. Locate the "View Intelligence Map" button
3. Click the button
4. Verify navigation to `/map/:id`

**Expected Results**:
- ✅ Button is visible (purple gradient, Network icon)
- ✅ Button is positioned next to "Chat with Report" button
- ✅ Clicking navigates to Intelligence Map page
- ✅ URL changes to `/map/:id`

**Documentation**:
```
Test Date: [Date]
Tester: [Name]
Result: ✅ Pass / ❌ Fail
Notes: [Any observations]
Screenshot: [If applicable]
```

---

### Test Case 2: Graph Building (First Time)

**Objective**: Verify graph is built successfully when no graph exists.

**Steps**:
1. Navigate to `/map/:id` for a research report
2. Observe the loading state
3. Wait for graph building to complete
4. Check browser console for errors
5. Verify graph appears

**Expected Results**:
- ✅ Loading indicator shows "Building intelligence map..."
- ✅ No errors in browser console
- ✅ Graph visualization appears (nodes and edges visible)
- ✅ Stats show node count, relationship count, cluster count
- ✅ Process completes within 60-90 seconds

**Documentation**:
```
Test Date: [Date]
Research ID: [ID]
Build Time: [Seconds]
Nodes Created: [Number]
Relationships Created: [Number]
Clusters Found: [Number]
Errors: [None / List errors]
Console Logs: [Relevant logs]
```

---

### Test Case 3: Entity Extraction Accuracy

**Objective**: Verify entities are extracted correctly from research report.

**Steps**:
1. Build graph for a research report
2. Review extracted entities in the graph
3. Compare with original report content
4. Check entity types are correct
5. Verify entity labels match report content

**Expected Results**:
- ✅ Entities match content in report
- ✅ Entity types are appropriate (Person, Organization, Technology, etc.)
- ✅ No duplicate entities
- ✅ Entity labels are clear and meaningful
- ✅ Confidence scores are reasonable (0.5-1.0)

**Documentation**:
```
Test Date: [Date]
Research Topic: [Topic]
Sample Entities Found:
  - [Entity 1] (Type: [Type], Confidence: [Score])
  - [Entity 2] (Type: [Type], Confidence: [Score])
  - [Entity 3] (Type: [Type], Confidence: [Score])
Accuracy: ✅ Good / ⚠️ Some issues / ❌ Poor
Issues Found: [List any incorrect extractions]
```

---

### Test Case 4: Relationship Extraction Accuracy

**Objective**: Verify relationships between entities are correctly identified.

**Steps**:
1. Build graph for a research report
2. Review relationships in the graph
3. Verify relationship types are appropriate
4. Check relationship evidence makes sense
5. Verify source and target entities are correct

**Expected Results**:
- ✅ Relationships are logical and accurate
- ✅ Relationship types match the connection (INFLUENCES, CAUSES, etc.)
- ✅ Evidence text supports the relationship
- ✅ No circular or invalid relationships
- ✅ Strength scores are reasonable

**Documentation**:
```
Test Date: [Date]
Sample Relationships Found:
  - [Entity A] --[INFLUENCES]--> [Entity B]
    Evidence: [Evidence text]
    Confidence: [Score]
    Strength: [Score]
  - [Entity C] --[CAUSES]--> [Entity D]
    Evidence: [Evidence text]
    Confidence: [Score]
    Strength: [Score]
Accuracy: ✅ Good / ⚠️ Some issues / ❌ Poor
Issues Found: [List any incorrect relationships]
```

---

### Test Case 5: Graph Visualization - Basic Interactions

**Objective**: Verify basic graph visualization interactions work.

**Steps**:
1. Load graph visualization
2. Test zoom in (button or mouse wheel)
3. Test zoom out (button or mouse wheel)
4. Test pan/drag (click and drag background)
5. Test node drag (click and drag a node)
6. Test hover on node (shows tooltip)
7. Test click on node (selects node, shows details)

**Expected Results**:
- ✅ Zoom in/out buttons work
- ✅ Mouse wheel zoom works
- ✅ Panning works smoothly
- ✅ Nodes can be dragged
- ✅ Hover shows tooltip with node info
- ✅ Click selects node and shows details panel
- ✅ No lag or performance issues

**Documentation**:
```
Test Date: [Date]
Zoom: ✅ Works / ❌ Issues
Pan: ✅ Works / ❌ Issues
Drag Nodes: ✅ Works / ❌ Issues
Hover: ✅ Works / ❌ Issues
Click: ✅ Works / ❌ Issues
Performance: ✅ Smooth / ⚠️ Some lag / ❌ Poor
Notes: [Any issues observed]
```

---

### Test Case 6: Filter by Entity Type

**Objective**: Verify filtering by entity type works correctly.

**Steps**:
1. Load graph visualization
2. Note total number of nodes
3. Click "All Types" filter (should show all)
4. Click a specific entity type filter (e.g., "Technology")
5. Verify only that type is shown
6. Click another type
7. Verify filter changes
8. Click "All Types" again

**Expected Results**:
- ✅ "All Types" shows all nodes
- ✅ Selecting a type filters correctly
- ✅ Only nodes of selected type are visible
- ✅ Relationships update to show only relevant connections
- ✅ Filter button highlights when active
- ✅ Switching filters works smoothly

**Documentation**:
```
Test Date: [Date]
Total Nodes: [Number]
Filter Tests:
  - All Types: ✅ Shows [Number] nodes
  - Technology: ✅ Shows [Number] nodes
  - Organization: ✅ Shows [Number] nodes
  - Person: ✅ Shows [Number] nodes
  - [Other types tested]
Issues: [Any filtering problems]
```

---

### Test Case 7: Cluster Highlighting

**Objective**: Verify cluster detection and highlighting works.

**Steps**:
1. Load graph visualization
2. Check clusters panel in sidebar
3. Note number of clusters
4. Click on a cluster
5. Verify cluster nodes are highlighted
6. Verify other nodes are dimmed
7. Click another cluster
8. Verify highlight changes
9. Click same cluster again (should deselect)

**Expected Results**:
- ✅ Clusters are detected and listed
- ✅ Cluster themes are meaningful
- ✅ Clicking cluster highlights nodes
- ✅ Non-cluster nodes are dimmed
- ✅ Cluster info shows node count
- ✅ Deselecting works (click again)

**Documentation**:
```
Test Date: [Date]
Clusters Found: [Number]
Cluster Details:
  - Cluster 1: [Theme] - [Number] nodes ✅ Highlights correctly
  - Cluster 2: [Theme] - [Number] nodes ✅ Highlights correctly
  - Cluster 3: [Theme] - [Number] nodes ✅ Highlights correctly
Issues: [Any highlighting problems]
```

---

### Test Case 8: Node Details Panel

**Objective**: Verify node details are displayed correctly when selected.

**Steps**:
1. Load graph visualization
2. Click on a node
3. Verify node details panel appears in sidebar
4. Check displayed information:
   - Label
   - Type
   - Description
   - Confidence score
5. Click another node
6. Verify details update
7. Click on background (empty area)
8. Verify details panel clears

**Expected Results**:
- ✅ Details panel appears when node clicked
- ✅ All information is displayed correctly
- ✅ Confidence score is shown as percentage
- ✅ Description is readable
- ✅ Clicking another node updates panel
- ✅ Clicking background clears selection

**Documentation**:
```
Test Date: [Date]
Node Details Test:
  - Node: [Entity Name]
  - Label: ✅ Correct
  - Type: ✅ Correct
  - Description: ✅ Present / ❌ Missing
  - Confidence: ✅ [Score]%
  - Citations: ✅ [Number] / ❌ Missing
Issues: [Any display problems]
```

---

### Test Case 9: Centrality Rankings

**Objective**: Verify most influential nodes are ranked correctly.

**Steps**:
1. Load graph visualization
2. Check "Most Influential" panel in sidebar
3. Verify top 5 nodes are listed
4. Check scores are displayed
5. Verify nodes in ranking match graph nodes
6. Compare visual node sizes with rankings

**Expected Results**:
- ✅ Top 5 nodes are listed
- ✅ Scores are displayed (numeric)
- ✅ Nodes match graph entities
- ✅ Higher scores = more connections (generally)
- ✅ Node sizes correlate with centrality

**Documentation**:
```
Test Date: [Date]
Top 5 Influential Nodes:
  1. [Node Name] - Score: [Number]
  2. [Node Name] - Score: [Number]
  3. [Node Name] - Score: [Number]
  4. [Node Name] - Score: [Number]
  5. [Node Name] - Score: [Number]
Accuracy: ✅ Makes sense / ⚠️ Questionable / ❌ Wrong
Notes: [Observations]
```

---

### Test Case 10: Export Functionality

**Objective**: Verify graph export works correctly.

**Steps**:
1. Load graph visualization
2. Click "Export Graph" button (download icon)
3. Verify file downloads
4. Check file name format: `research_map_[id]_[timestamp].json`
5. Open downloaded JSON file
6. Verify structure:
   - `topic` field
   - `nodes` array
   - `relationships` array
   - `clusters` array
   - `centrality` array
   - `exportedAt` timestamp

**Expected Results**:
- ✅ File downloads successfully
- ✅ File name is correct format
- ✅ JSON is valid and parseable
- ✅ All graph data is included
- ✅ Data structure matches expected format

**Documentation**:
```
Test Date: [Date]
Export Test:
  - File Name: ✅ Correct format
  - File Size: [Bytes/KB]
  - JSON Valid: ✅ Yes / ❌ No
  - Contains Nodes: ✅ [Number]
  - Contains Relationships: ✅ [Number]
  - Contains Clusters: ✅ [Number]
  - Contains Centrality: ✅ Yes / ❌ No
Issues: [Any export problems]
```

---

### Test Case 11: Graph Rebuild

**Objective**: Verify graph can be rebuilt/refreshed.

**Steps**:
1. Load existing graph
2. Click "Rebuild Graph" button (refresh icon)
3. Verify loading state appears
4. Wait for rebuild to complete
5. Verify graph updates
6. Check if data changed (if report was updated)

**Expected Results**:
- ✅ Rebuild button is visible
- ✅ Loading state shows during rebuild
- ✅ Graph rebuilds successfully
- ✅ No errors occur
- ✅ Graph updates if report changed

**Documentation**:
```
Test Date: [Date]
Rebuild Test:
  - Button Visible: ✅ Yes
  - Loading State: ✅ Works
  - Rebuild Time: [Seconds]
  - Success: ✅ Yes / ❌ No
  - Data Updated: ✅ Yes / ❌ No
Issues: [Any problems]
```

---

### Test Case 12: Error Handling

**Objective**: Verify error handling works gracefully.

**Test Scenarios**:

#### 12a: Missing Report Data
**Steps**:
1. Navigate to `/map/:id` with invalid ID
2. Verify error message appears
3. Check error is user-friendly

**Expected**: Clear error message, retry option

#### 12b: API Failure
**Steps**:
1. Disable network (or block API calls)
2. Try to build graph
3. Verify error handling

**Expected**: Error message, no crash

#### 12c: Empty Report
**Steps**:
1. Create report with minimal content
2. Try to build graph
3. Verify handling

**Expected**: Graceful handling, informative message

**Documentation**:
```
Test Date: [Date]
Error Handling Tests:
  - Invalid ID: ✅ Handled / ❌ Crashes
  - API Failure: ✅ Handled / ❌ Crashes
  - Empty Report: ✅ Handled / ❌ Crashes
Error Messages: ✅ Clear / ❌ Confusing
User Experience: ✅ Good / ❌ Poor
```

---

### Test Case 13: Performance Testing

**Objective**: Verify performance is acceptable.

**Steps**:
1. Build graph for large report (many findings)
2. Measure build time
3. Test visualization performance:
   - Zoom in/out speed
   - Pan smoothness
   - Node drag responsiveness
4. Check memory usage (browser dev tools)
5. Test with multiple graphs in same session

**Expected Results**:
- ✅ Build time < 90 seconds for typical report
- ✅ Visualization is smooth (60fps)
- ✅ No memory leaks
- ✅ No browser crashes

**Documentation**:
```
Test Date: [Date]
Performance Metrics:
  - Build Time: [Seconds]
  - Nodes: [Number]
  - Relationships: [Number]
  - Visualization FPS: [FPS]
  - Memory Usage: [MB]
  - Browser: [Chrome/Firefox/etc]
Performance: ✅ Good / ⚠️ Acceptable / ❌ Poor
Issues: [Performance problems]
```

---

### Test Case 14: Neo4j Integration (If Configured)

**Objective**: Verify Neo4j persistence works.

**Steps**:
1. Build graph (should save to Neo4j)
2. Close browser tab
3. Reopen same graph URL
4. Verify graph loads from Neo4j (faster)
5. Check Neo4j database for nodes/relationships
6. Verify researchId isolation

**Expected Results**:
- ✅ Graph saves to Neo4j
- ✅ Graph loads from Neo4j on revisit
- ✅ Load time is faster (no rebuild)
- ✅ Data persists correctly
- ✅ Research isolation works

**Documentation**:
```
Test Date: [Date]
Neo4j Test:
  - Connection: ✅ Working / ❌ Failed
  - Save: ✅ Success / ❌ Failed
  - Load: ✅ Success / ❌ Failed
  - Load Time: [Seconds] (should be < 5s)
  - Data Persistence: ✅ Correct / ❌ Missing
  - Isolation: ✅ Works / ❌ Issues
```

---

## 📊 Test Results Template

### Test Session Summary

```
===========================================
RESEARCH INTELLIGENCE MAP - TEST RESULTS
===========================================

Test Date: [Date]
Tester: [Name]
Environment: [Development/Staging/Production]
Browser: [Chrome/Firefox/Safari] [Version]
Node Version: [Version]
Supabase Project: [Project Name]

OVERALL STATUS: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

===========================================
TEST RESULTS
===========================================

Test Case 1: Access Intelligence Map
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 2: Graph Building
  Status: ✅ / ❌
  Build Time: [Seconds]
  Nodes: [Number]
  Relationships: [Number]
  Notes: [Notes]

Test Case 3: Entity Extraction
  Status: ✅ / ❌
  Accuracy: [Good/Fair/Poor]
  Notes: [Notes]

Test Case 4: Relationship Extraction
  Status: ✅ / ❌
  Accuracy: [Good/Fair/Poor]
  Notes: [Notes]

Test Case 5: Basic Interactions
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 6: Filtering
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 7: Cluster Highlighting
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 8: Node Details
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 9: Centrality Rankings
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 10: Export
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 11: Rebuild
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 12: Error Handling
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 13: Performance
  Status: ✅ / ❌
  Notes: [Notes]

Test Case 14: Neo4j Integration
  Status: ✅ / ❌ / N/A (not configured)
  Notes: [Notes]

===========================================
ISSUES FOUND
===========================================

[Priority] [Issue Description]
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Screenshots/logs

===========================================
RECOMMENDATIONS
===========================================

[Any recommendations for improvements]

===========================================
```

---

## 🔍 Testing Checklist

### Pre-Testing
- [ ] Development server running
- [ ] Supabase configured
- [ ] Edge functions deployed
- [ ] Test research report available
- [ ] Browser dev tools open

### Core Functionality
- [ ] Can access Intelligence Map from report
- [ ] Graph builds successfully
- [ ] Entities extracted correctly
- [ ] Relationships extracted correctly
- [ ] Visualization displays correctly

### Interactions
- [ ] Zoom works
- [ ] Pan works
- [ ] Node drag works
- [ ] Hover shows tooltip
- [ ] Click selects node
- [ ] Filters work
- [ ] Clusters highlight
- [ ] Export works

### Edge Cases
- [ ] Handles missing data
- [ ] Handles API errors
- [ ] Handles empty reports
- [ ] Handles large graphs
- [ ] Handles slow network

### Performance
- [ ] Build time acceptable
- [ ] Visualization smooth
- [ ] No memory leaks
- [ ] No crashes

---

## 📸 Screenshot Guidelines

Take screenshots for:
1. ✅ Successful graph build
2. ✅ Graph visualization
3. ✅ Filtered views
4. ✅ Cluster highlighting
5. ✅ Node details panel
6. ✅ Error states
7. ✅ Export confirmation

**Screenshot Naming**: `test_[testcase]_[date]_[timestamp].png`

---

## 🐛 Bug Report Template

```
BUG REPORT
==========

Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Test Case: [Which test case]
Date: [Date]
Reporter: [Name]

DESCRIPTION
-----------
[Detailed description of the issue]

STEPS TO REPRODUCE
------------------
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED BEHAVIOR
-----------------
[What should happen]

ACTUAL BEHAVIOR
---------------
[What actually happens]

ENVIRONMENT
-----------
- Browser: [Browser + Version]
- OS: [Operating System]
- Research ID: [ID if applicable]
- Graph Stats: [Nodes/Relationships if applicable]

SCREENSHOTS/LOGS
----------------
[Attach screenshots or console logs]

ADDITIONAL NOTES
---------------
[Any other relevant information]
```

---

## ✅ Sign-Off

After completing all tests:

```
TESTING COMPLETE
================

Date: [Date]
Tester: [Name]
Status: ✅ Ready for Production / ⚠️ Needs Fixes / ❌ Not Ready

Critical Issues: [Number]
High Issues: [Number]
Medium Issues: [Number]
Low Issues: [Number]

Approved By: [Name]
Date: [Date]
```

---

## 📝 Notes

- Test with different research topics (technology, healthcare, business, etc.)
- Test with reports of varying sizes (small, medium, large)
- Test on different browsers
- Test on different screen sizes
- Document any unexpected behaviors
- Keep detailed logs of API calls and responses
- Note any performance issues

---

**Last Updated**: [Date]  
**Version**: 1.0

