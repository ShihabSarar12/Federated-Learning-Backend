// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EarIdentification
 * @notice Department-based isolation for IPFS image CIDs with pagination + per-user indexing.
 * @dev Admin (backend) assigns roles & departments, and registers CIDs to a department for a given user address.
 *      Dept members can ONLY list/read their own department dataset (paginated).
 *      Admin/Special can list/read any department dataset (paginated).
 *      Admin/Special can also list/read CIDs registered "for a given address" (paginated).
 */
contract EarIdentification {
    enum Role {
        NONE,
        DEPT_USER,
        AUDITOR,
        SPECIAL
    }

    enum Department {
        NONE,
        CSE,
        EEE,
        ME
    }

    address public immutable admin;

    mapping(address => Role) public roles;
    mapping(address => Department) public departmentOf;

    struct ImageMeta {
        string cid;
        uint256 timestamp;
        address registrar;
        Department department;
    }

    ImageMeta[] private imageLog;

    mapping(Department => uint256[]) private deptToImageIndices;

    // User address -> indices into imageLog (so backend can fetch by address)
    mapping(address => uint256[]) private userToImageIndices;

    // keccak256(cid) -> (index + 1) in imageLog for uniqueness check
    mapping(bytes32 => uint256) private indexByCidHash;

    event RoleUpdated(address indexed entity, Role role);
    event DepartmentUpdated(address indexed entity, Department department);
    event ImageRegistered(
        uint256 indexed index,
        Department indexed department,
        string cid,
        uint256 timestamp,
        address indexed entity // who this CID was registered "for"
    );

    modifier onlyAdmin() {
        require(
            msg.sender == admin || roles[msg.sender] == Role.SPECIAL,
            "Not admin"
        );
        _;
    }

    modifier onlyAuthorized() {
        require(roles[msg.sender] != Role.NONE, "Not authorized");
        _;
    }

    modifier onlyDeptMember() {
        Department d = departmentOf[msg.sender];
        require(d != Department.NONE, "No department assigned");
        _;
    }

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.SPECIAL;
        emit RoleUpdated(msg.sender, Role.SPECIAL);
    }

    function setRole(address entity, Role role_) external onlyAdmin {
        roles[entity] = role_;
        emit RoleUpdated(entity, role_);
    }

    function setDepartment(address entity, Department dept) external onlyAdmin {
        departmentOf[entity] = dept;
        emit DepartmentUpdated(entity, dept);
    }

    function getUserDepartment(
        address user
    ) external view returns (bool assigned, Department dept) {
        dept = departmentOf[user];
        assigned = (dept != Department.NONE);
    }

    function isUserInDepartment(
        address user,
        Department dept
    ) external view returns (bool) {
        require(dept != Department.NONE, "Invalid department");
        return departmentOf[user] == dept;
    }

    /**
     * @notice Admin/backend registers an image CID into the department dataset of `entity`
     *         and also stores it under that `entity` address for later retrieval.
     * @dev Enforces global CID uniqueness (a CID can exist only once across all depts/users).
     */
    function registerImageToDepartment(
        string calldata cid,
        address entity
    ) external onlyAdmin {
        Department dept = departmentOf[entity];
        require(dept != Department.NONE, "Invalid department");
        require(bytes(cid).length != 0, "Empty CID");

        bytes32 h = keccak256(bytes(cid));
        require(indexByCidHash[h] == 0, "CID already registered");

        uint256 ts = block.timestamp;

        imageLog.push(
            ImageMeta({
                cid: cid,
                timestamp: ts,
                registrar: entity,
                department: dept
            })
        );

        uint256 index = imageLog.length - 1;

        deptToImageIndices[dept].push(index);
        userToImageIndices[entity].push(index);

        indexByCidHash[h] = index + 1;

        emit ImageRegistered(index, dept, cid, ts, entity);
    }

    function myDepartmentImageCount(
        address user
    ) external view onlyAuthorized onlyDeptMember returns (uint256) {
        return deptToImageIndices[departmentOf[user]].length;
    }

    function getMyDepartmentCIDs(
        address user,
        uint256 start,
        uint256 limit
    )
        external
        view
        onlyAuthorized
        onlyDeptMember
        returns (string[] memory cids, uint256[] memory globalIndices)
    {
        Department dept = departmentOf[user];
        uint256[] storage idxs = deptToImageIndices[dept];
        uint256 n = idxs.length;

        if (start >= n) {
            return (new string[](0), new uint256[](0));
        }

        uint256 end = start + limit;
        if (end > n) end = n;

        uint256 size = end - start;
        cids = new string[](size);
        globalIndices = new uint256[](size);

        for (uint256 i = 0; i < size; i++) {
            uint256 globalIndex = idxs[start + i];
            globalIndices[i] = globalIndex;
            cids[i] = imageLog[globalIndex].cid;
        }
    }

    function departmentImageCount(
        Department dept
    ) external view onlyAdmin returns (uint256) {
        require(dept != Department.NONE, "Invalid department");
        return deptToImageIndices[dept].length;
    }

    function getDepartmentCIDs(
        Department dept,
        uint256 start,
        uint256 limit
    )
        external
        view
        onlyAdmin
        returns (string[] memory cids, uint256[] memory globalIndices)
    {
        require(dept != Department.NONE, "Invalid department");

        uint256[] storage idxs = deptToImageIndices[dept];
        uint256 n = idxs.length;

        if (start >= n) {
            return (new string[](0), new uint256[](0));
        }

        uint256 end = start + limit;
        if (end > n) end = n;

        uint256 size = end - start;
        cids = new string[](size);
        globalIndices = new uint256[](size);

        for (uint256 i = 0; i < size; i++) {
            uint256 globalIndex = idxs[start + i];
            globalIndices[i] = globalIndex;
            cids[i] = imageLog[globalIndex].cid;
        }
    }

    // -------------------------------------------------------------------------
    // Per-user views (backend can retrieve CIDs by address parameter)
    // -------------------------------------------------------------------------

    /**
     * @notice Admin/Special: how many images were registered for `user`.
     */
    function userImageCount(
        address user
    ) external view onlyAdmin returns (uint256) {
        return userToImageIndices[user].length;
    }

    /**
     * @notice Admin/Special: list CIDs registered for `user` (paginated).
     */
    function getUserCIDs(
        address user,
        uint256 start,
        uint256 limit
    )
        external
        view
        onlyAdmin
        returns (string[] memory cids, uint256[] memory globalIndices)
    {
        uint256[] storage idxs = userToImageIndices[user];
        uint256 n = idxs.length;

        if (start >= n) {
            return (new string[](0), new uint256[](0));
        }

        uint256 end = start + limit;
        if (end > n) end = n;

        uint256 size = end - start;
        cids = new string[](size);
        globalIndices = new uint256[](size);

        for (uint256 i = 0; i < size; i++) {
            uint256 globalIndex = idxs[start + i];
            globalIndices[i] = globalIndex;
            cids[i] = imageLog[globalIndex].cid;
        }
    }
}
