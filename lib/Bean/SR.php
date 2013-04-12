<?php
/**
 * This file is a part of Xen Orchestra Server.
 *
 * Xen Orchestra Server is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * Xen Orchestra Server is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Xen Orchestra Server. If not, see
 * <http://www.gnu.org/licenses/>.
 *
 * @author Julien Fontanet <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/gpl-3.0-standalone.html GPLv3
 *
 * @package Xen Orchestra Server
 */

namespace Bean;

/**
 *
 */
final class SR extends BeanAbstract
{
	protected static $_fields;
}
SR::init(array(
	'id',
	'uuid',

	'PBDs' => true,
	'VDIs' => true,
	'allowed_operations' => true,
	'blobs' => true,
	'content_type',
	'current_operations' => true,
	'introduced_by',
	'local_cache_enabled',
	'name_description',
	'name_label',
	'other_config' => true,
	'physical_size',
	'physical_utilisation',
	'shared',
	'sm_config' => true,
	'tags' => true,
	'type',
	'virtual_allocation',
));